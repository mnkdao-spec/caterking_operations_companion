import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Table Group interface for real-time subscription
 */
export interface TableGroup {
  id: string;
  eventId: string;
  name: string;
  guestCount: number;
  courses: CourseStatus[];
}

export interface CourseStatus {
  courseNumber: number;
  name: string;
  status: "pending" | "fired" | "in_progress" | "ready" | "served";
  itemCount: number;
  readyCount: number;
  firedAt?: Date;
  menuItemIds?: string[];
}

/**
 * Order Item interface for real-time subscription
 */
export interface OrderItem {
  id: string;
  eventId: string;
  stationType: string;
  name: string;
  quantity: number;
  tableGroup: string;
  tableNumber: number;
  modifications: string[];
  firedAt: Date;
  course: string;
  menuItemId?: string;
  status: "pending" | "fired" | "in_progress" | "ready" | "completed";
}

/**
 * Station Status interface for real-time subscription
 */
export interface StationStatus {
  id: string;
  eventId: string;
  name: string;
  queueCount: number;
  oldestItemMinutes: number;
  status: "idle" | "active" | "behind";
}

/**
 * Inventory Item interface for real-time subscription
 */
export interface InventoryItem {
  id: string;
  eventId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unit: string;
  status: "available" | "low" | "out_of_stock";
}

/**
 * Hook to subscribe to table groups in real-time
 */
export function useKDSTableGroups(eventId: string) {
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    const fetchTableGroups = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("kds_table_groups")
          .select("*")
          .eq("event_id", eventId);

        if (fetchError) throw fetchError;
        setTableGroups(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTableGroups();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`table_groups:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kds_table_groups",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTableGroups((prev) => [...prev, payload.new as TableGroup]);
          } else if (payload.eventType === "UPDATE") {
            setTableGroups((prev) =>
              prev.map((tg) => (tg.id === payload.new.id ? (payload.new as TableGroup) : tg))
            );
          } else if (payload.eventType === "DELETE") {
            setTableGroups((prev) => prev.filter((tg) => tg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  return { tableGroups, loading, error };
}

/**
 * Hook to subscribe to orders in real-time
 */
export function useKDSOrders(eventId: string, stationType?: string) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    const fetchOrders = async () => {
      try {
        let query = supabase
          .from("kds_orders")
          .select("*")
          .eq("event_id", eventId);

        if (stationType) {
          query = query.eq("station_type", stationType);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setOrders(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Subscribe to real-time updates
    const filter = stationType
      ? `event_id=eq.${eventId},station_type=eq.${stationType}`
      : `event_id=eq.${eventId}`;

    const subscription = supabase
      .channel(`orders:${eventId}:${stationType || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kds_orders",
          filter,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [...prev, payload.new as OrderItem]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as OrderItem) : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, stationType]);

  return { orders, loading, error };
}

/**
 * Hook to subscribe to station status in real-time
 */
export function useKDSStations(eventId: string) {
  const [stations, setStations] = useState<StationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    const fetchStations = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("kds_stations")
          .select("*")
          .eq("event_id", eventId);

        if (fetchError) throw fetchError;
        setStations(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`stations:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kds_stations",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setStations((prev) => [...prev, payload.new as StationStatus]);
          } else if (payload.eventType === "UPDATE") {
            setStations((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as StationStatus) : s))
            );
          } else if (payload.eventType === "DELETE") {
            setStations((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  return { stations, loading, error };
}

/**
 * Hook to subscribe to inventory in real-time
 */
export function useKDSInventory(eventId: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    const fetchInventory = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("kds_inventory")
          .select("*")
          .eq("event_id", eventId);

        if (fetchError) throw fetchError;
        setInventory(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`inventory:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kds_inventory",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setInventory((prev) => [...prev, payload.new as InventoryItem]);
          } else if (payload.eventType === "UPDATE") {
            setInventory((prev) =>
              prev.map((i) => (i.id === payload.new.id ? (payload.new as InventoryItem) : i))
            );
          } else if (payload.eventType === "DELETE") {
            setInventory((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  return { inventory, loading, error };
}

/**
 * Hook to subscribe to multiple data sources simultaneously
 */
export function useKDSRealtimeData(eventId: string, stationType?: string) {
  const tableGroups = useKDSTableGroups(eventId);
  const orders = useKDSOrders(eventId, stationType);
  const stations = useKDSStations(eventId);
  const inventory = useKDSInventory(eventId);

  const loading = tableGroups.loading || orders.loading || stations.loading || inventory.loading;
  const error = tableGroups.error || orders.error || stations.error || inventory.error;

  return {
    tableGroups: tableGroups.tableGroups,
    orders: orders.orders,
    stations: stations.stations,
    inventory: inventory.inventory,
    loading,
    error,
  };
}
