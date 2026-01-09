import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useKDSRealtime } from "./kds-context-realtime";
import {
  decrementInventoryForOrderItem,
  inventoryStatusService,
  lowStockAlertsService,
  inventoryRealtimeSubscriptions,
  type InventoryStatus,
  type LowStockAlert,
} from "./supabase-inventory";
import { orderItemsService } from "./supabase-kds";

interface KDSInventoryContextType {
  // Existing KDS operations
  bumpItemWithInventory: (itemId: string) => Promise<void>;

  // Inventory tracking
  inventoryStatus: InventoryStatus[];
  lowStockAlerts: LowStockAlert[];
  inventoryValue: number;
  isLoadingInventory: boolean;
  inventoryError: string | null;

  // Inventory operations
  loadInventoryStatus: () => Promise<void>;
  acknowledgeLowStockAlert: (alertId: string, userId: string) => Promise<void>;
  getUnacknowledgedAlertsCount: () => number;

  // Subscriptions
  subscribeToInventoryUpdates: () => void;
  unsubscribeFromInventoryUpdates: () => void;
}

const KDSInventoryContext = createContext<KDSInventoryContextType | null>(null);

export function KDSInventoryProvider({ children }: { children: ReactNode }) {
  const kds = useKDSRealtime();

  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventorySubscriptions, setInventorySubscriptions] = useState<Array<() => void>>([]);

  // Load inventory status for current event
  const loadInventoryStatus = useCallback(async () => {
    if (!kds.currentEvent) return;

    setIsLoadingInventory(true);
    setInventoryError(null);

    try {
      const [status, alerts, value] = await Promise.all([
        inventoryStatusService.getEventInventoryStatus(kds.currentEvent.id),
        lowStockAlertsService.getForEvent(kds.currentEvent.id, true),
        inventoryStatusService.getInventoryValue(kds.currentEvent.id),
      ]);

      setInventoryStatus(status);
      setLowStockAlerts(alerts);
      setInventoryValue(value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load inventory";
      setInventoryError(errorMessage);
      console.error("Error loading inventory status:", error);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [kds.currentEvent]);

  // Bump item with automatic inventory decrement
  const bumpItemWithInventory = useCallback(
    async (itemId: string) => {
      try {
        if (!kds.currentEvent) {
          throw new Error("No active event");
        }

        // Get the order item to find the menu item
        const orderItem = kds.firedCourses
          .flatMap((fc) => fc.items || [])
          .find((item) => item.id === itemId);

        if (!orderItem) {
          throw new Error("Order item not found");
        }

        // Bump the item in KDS
        await kds.bumpItem(itemId);

        // Decrement inventory
        const decrementResult = await decrementInventoryForOrderItem(
          kds.currentEvent.id,
          orderItem.menuItemId,
          itemId,
          orderItem.quantity
        );

        if (!decrementResult.success) {
          console.warn("Inventory decrement warning:", decrementResult.message);
          setInventoryError(decrementResult.message);
        }

        // If low stock alerts were created, reload inventory status
        if (decrementResult.alertsCreated > 0) {
          await loadInventoryStatus();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to bump item";
        setInventoryError(errorMessage);
        console.error("Error bumping item with inventory:", error);
      }
    },
    [kds, loadInventoryStatus]
  );

  // Acknowledge low stock alert
  const acknowledgeLowStockAlert = useCallback(async (alertId: string, userId: string) => {
    try {
      await lowStockAlertsService.acknowledgeAlert(alertId, userId);
      setLowStockAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true, acknowledged_by: userId } : alert
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to acknowledge alert";
      setInventoryError(errorMessage);
      console.error("Error acknowledging alert:", error);
    }
  }, []);

  // Get unacknowledged alerts count
  const getUnacknowledgedAlertsCount = useCallback(() => {
    return lowStockAlerts.filter((alert) => !alert.acknowledged).length;
  }, [lowStockAlerts]);

  // Subscribe to inventory updates
  const subscribeToInventoryUpdates = useCallback(() => {
    if (!kds.currentEvent) return;

    const newSubscriptions: Array<() => void> = [];

    // Subscribe to low stock alerts
    const unsubscribeLowStock = inventoryRealtimeSubscriptions.subscribeToLowStockAlerts(
      kds.currentEvent.id,
      (alert: LowStockAlert) => {
        setLowStockAlerts((prev) => {
          const exists = prev.find((a) => a.id === alert.id);
          if (exists) {
            return prev.map((a) => (a.id === alert.id ? alert : a));
          }
          return [...prev, alert];
        });
      }
    );
    newSubscriptions.push(unsubscribeLowStock);

    // Subscribe to stock level changes
    const unsubscribeStockChanges = inventoryRealtimeSubscriptions.subscribeToStockLevelChanges(
      kds.currentEvent.id,
      () => {
        // Reload inventory status when stock changes
        loadInventoryStatus();
      }
    );
    newSubscriptions.push(unsubscribeStockChanges);

    setInventorySubscriptions(newSubscriptions);
  }, [kds.currentEvent, loadInventoryStatus]);

  // Unsubscribe from inventory updates
  const unsubscribeFromInventoryUpdates = useCallback(() => {
    inventorySubscriptions.forEach((unsubscribe) => unsubscribe());
    setInventorySubscriptions([]);
  }, [inventorySubscriptions]);

  // Load inventory on event change
  useEffect(() => {
    if (kds.currentEvent) {
      loadInventoryStatus();
      subscribeToInventoryUpdates();
    }

    return () => {
      unsubscribeFromInventoryUpdates();
    };
  }, [kds.currentEvent?.id]);

  const value: KDSInventoryContextType = {
    bumpItemWithInventory,
    inventoryStatus,
    lowStockAlerts,
    inventoryValue,
    isLoadingInventory,
    inventoryError,
    loadInventoryStatus,
    acknowledgeLowStockAlert,
    getUnacknowledgedAlertsCount,
    subscribeToInventoryUpdates,
    unsubscribeFromInventoryUpdates,
  };

  return (
    <KDSInventoryContext.Provider value={value}>{children}</KDSInventoryContext.Provider>
  );
}

export function useKDSInventory() {
  const context = useContext(KDSInventoryContext);
  if (!context) {
    throw new Error("useKDSInventory must be used within a KDSInventoryProvider");
  }
  return context;
}
