import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { handleBatchOrderCompletion } from "@/lib/kds-inventory-integration";
import { KDSErrorRecovery } from "@/components/kds-error-recovery";
import { useKDSRealtimeData } from "@/hooks/use-kds-realtime";

// KDS Color palette
const KDS_COLORS = {
  background: "#1A1A1A",
  surface: "#2D2D2D",
  surfaceLight: "#3D3D3D",
  text: "#FFFFFF",
  textMuted: "#888888",
  fire: "#FF6B35",
  bump: "#4CAF50",
  warning: "#FFB800",
  urgent: "#FF3B30",
  ready: "#34C759",
  border: "#444444",
  plating: "#3498DB",
};

interface PlateComponent {
  id: string;
  name: string;
  station: string;
  status: "waiting" | "ready";
  readyAt?: Date;
}

interface PlateOrder {
  id: string;
  tableGroup: string;
  tableNumber: number;
  course: string;
  guestCount: number;
  components: PlateComponent[];
  allReady: boolean;
  waitingTime: number; // minutes since first component was ready
  eventId?: string; // For inventory tracking
}

const MOCK_PLATE_ORDERS: PlateOrder[] = [
  {
    id: "p1",
    tableGroup: "Tables 1-4",
    tableNumber: 2,
    course: "Main Course",
    guestCount: 8,
    components: [
      { id: "c1", name: "Ribeye Steak ×4", station: "GRILL", status: "ready", readyAt: new Date(Date.now() - 2 * 60000) },
      { id: "c2", name: "Grilled Salmon ×2", station: "GRILL", status: "ready", readyAt: new Date(Date.now() - 1 * 60000) },
      { id: "c3", name: "Mushroom Risotto ×2", station: "SAUTÉ", status: "ready", readyAt: new Date(Date.now() - 30000) },
    ],
    allReady: true,
    waitingTime: 2,
    eventId: "event-wedding",
  },
  {
    id: "p2",
    tableGroup: "Tables 5-8",
    tableNumber: 6,
    course: "Main Course",
    guestCount: 6,
    components: [
      { id: "c4", name: "Lamb Chops ×3", station: "GRILL", status: "ready", readyAt: new Date(Date.now() - 1 * 60000) },
      { id: "c5", name: "Shrimp Scampi ×2", station: "SAUTÉ", status: "waiting" },
      { id: "c6", name: "Vegetable Medley ×6", station: "GARDE", status: "ready", readyAt: new Date() },
    ],
    allReady: false,
    waitingTime: 1,
    eventId: "event-wedding",
  },
  {
    id: "p3",
    tableGroup: "Tables 9-12",
    tableNumber: 10,
    course: "Salads",
    guestCount: 10,
    components: [
      { id: "c7", name: "Caesar Salad ×6", station: "GARDE", status: "ready", readyAt: new Date(Date.now() - 3 * 60000) },
      { id: "c8", name: "Caprese ×4", station: "GARDE", status: "ready", readyAt: new Date(Date.now() - 2 * 60000) },
    ],
    allReady: true,
    waitingTime: 3,
    eventId: "event-wedding",
  },
  {
    id: "p4",
    tableGroup: "Tables 1-4",
    tableNumber: 3,
    course: "Dessert",
    guestCount: 8,
    components: [
      { id: "c9", name: "Chocolate Lava Cake ×4", station: "DESSERT", status: "waiting" },
      { id: "c10", name: "Tiramisu ×4", station: "DESSERT", status: "waiting" },
    ],
    allReady: false,
    waitingTime: 0,
    eventId: "event-wedding",
  },
];

export default function PlatingStation() {
  const [eventId] = useState("event-wedding"); // From navigation params in real app
  const { orders: liveOrders, loading, error } = useKDSRealtimeData(eventId, "plating");
  const [orders, setOrders] = useState<PlateOrder[]>(MOCK_PLATE_ORDERS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "ready" | "waiting">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Use live data when available, fallback to mock data
  useEffect(() => {
    if (!loading && liveOrders.length > 0) {
      setOrders(liveOrders as any);
    } else if (!loading) {
      setOrders(MOCK_PLATE_ORDERS);
    }
  }, [liveOrders, loading])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlateComplete = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Call inventory transaction system for single order
      const result = await handleBatchOrderCompletion([orderId], order.eventId || "event-default");

      if (result.length > 0 && result[0].success) {
        // Haptic feedback for success
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Remove order from queue
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setCompletedCount((prev) => prev + 1);
      } else {
        // Show error to operator
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        const errorMsg = result.length > 0 ? result[0].message : "Unknown error";
        setProcessingError(errorMsg);
        setShowErrorModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setProcessingError(`Failed to complete order: ${errorMessage}`);
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlateMultiple = async () => {
    const readyOrderIds = orders.filter((o) => o.allReady).map((o) => o.id);
    if (readyOrderIds.length === 0) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Get first event ID from ready orders
      const firstReadyOrder = orders.find((o) => o.allReady);
      const eventId = firstReadyOrder?.eventId || "event-default";

      const results = await handleBatchOrderCompletion(readyOrderIds, eventId);

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (successful > 0) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Remove successful orders
        setOrders((prev) =>
          prev.filter((o) => !readyOrderIds.includes(o.id))
        );
        setCompletedCount((prev) => prev + successful);
      }

      if (failed > 0) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setProcessingError(`${successful} completed, ${failed} failed. Check inventory.`);
        setShowErrorModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setProcessingError(`Failed to complete orders: ${errorMessage}`);
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "ready") return order.allReady;
    if (filter === "waiting") return !order.allReady;
    return true;
  });

  const readyCount = orders.filter((o) => o.allReady).length;
  const waitingCount = orders.filter((o) => !o.allReady).length;

  const renderComponent = (component: PlateComponent) => (
    <View
      key={component.id}
      style={[
        styles.componentRow,
        component.status === "ready" && styles.componentReady,
      ]}
    >
      <View
        style={[
          styles.componentStatus,
          { backgroundColor: component.status === "ready" ? KDS_COLORS.ready : KDS_COLORS.textMuted },
        ]}
      >
        {component.status === "ready" ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={styles.waitingDot}>○</Text>
        )}
      </View>
      <View style={styles.componentInfo}>
        <Text style={styles.componentName}>{component.name}</Text>
        <Text style={styles.componentStation}>{component.station}</Text>
      </View>
      {component.status === "waiting" && (
        <Text style={styles.waitingLabel}>WAITING</Text>
      )}
    </View>
  );

  const renderPlateOrder = ({ item }: { item: PlateOrder }) => (
    <View
      style={[
        styles.plateCard,
        item.allReady && styles.plateCardReady,
        item.waitingTime >= 3 && item.allReady && styles.plateCardUrgent,
      ]}
    >
      {/* Header */}
      <View style={styles.plateHeader}>
        <View style={styles.plateInfo}>
          <Text style={styles.tableNumber}>Table {item.tableNumber}</Text>
          <Text style={styles.tableGroup}>{item.tableGroup}</Text>
        </View>
        <View style={styles.plateMetaRight}>
          <Text style={styles.courseName}>{item.course}</Text>
          <Text style={styles.guestCount}>{item.guestCount} guests</Text>
        </View>
      </View>

      {/* Status Banner */}
      {item.allReady && (
        <View
          style={[
            styles.statusBanner,
            item.waitingTime >= 3 && styles.statusBannerUrgent,
          ]}
        >
          <Text style={styles.statusBannerText}>
            {item.waitingTime >= 3
              ? `⚠️ READY ${item.waitingTime}m - PLATE NOW!`
              : `✓ ALL COMPONENTS READY`}
          </Text>
        </View>
      )}

      {/* Components List */}
      <View style={styles.componentsList}>
        {item.components.map(renderComponent)}
      </View>

      {/* Action Button */}
      {item.allReady && (
        <TouchableOpacity
          onPress={() => handlePlateComplete(item.id)}
          style={[styles.plateButton, isProcessing && styles.plateButtonDisabled]}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={KDS_COLORS.text} />
          ) : (
            <Text style={styles.plateButtonText}>🍽️ PLATED & SERVED</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← STATIONS</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.stationTitle}>🍽️ PLATING STATION</Text>
          <Text style={styles.subtitle}>Assembly & Service Coordination</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeDisplay}>
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, filter === "all" && styles.filterTabTextActive]}>
            ALL ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("ready")}
          style={[
            styles.filterTab,
            filter === "ready" && styles.filterTabActive,
            { borderColor: KDS_COLORS.ready },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === "ready" && styles.filterTabTextActive,
              filter === "ready" && { color: KDS_COLORS.ready },
            ]}
          >
            ✓ READY ({readyCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("waiting")}
          style={[
            styles.filterTab,
            filter === "waiting" && styles.filterTabActive,
            { borderColor: KDS_COLORS.warning },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === "waiting" && styles.filterTabTextActive,
              filter === "waiting" && { color: KDS_COLORS.warning },
            ]}
          >
            ○ WAITING ({waitingCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Batch Action Button */}
      {readyCount > 1 && (
        <TouchableOpacity
          onPress={handlePlateMultiple}
          style={[styles.batchButton, isProcessing && styles.batchButtonDisabled]}
          disabled={isProcessing}
        >
          <Text style={styles.batchButtonText}>🚀 PLATE ALL {readyCount} READY</Text>
        </TouchableOpacity>
      )}

      {/* Orders Grid */}
      <FlatList
        data={filteredOrders}
        renderItem={renderPlateOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        scrollEnabled={!isProcessing}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>NO ORDERS</Text>
            <Text style={styles.emptySubtitle}>
              {filter === "ready"
                ? "No orders ready for plating"
                : filter === "waiting"
                ? "All orders are ready!"
                : "No orders in queue"}
            </Text>
          </View>
        }
      />

      {/* Footer Summary */}
      <View style={styles.footer}>
        <View style={styles.footerStat}>
          <Text style={[styles.footerStatValue, { color: KDS_COLORS.ready }]}>
            {readyCount}
          </Text>
          <Text style={styles.footerStatLabel}>Ready to Plate</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={[styles.footerStatValue, { color: KDS_COLORS.warning }]}>
            {waitingCount}
          </Text>
          <Text style={styles.footerStatLabel}>Waiting</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={[styles.footerStatValue, { color: KDS_COLORS.bump }]}>
            {completedCount}
          </Text>
          <Text style={styles.footerStatLabel}>Completed</Text>
        </View>
      </View>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <Text style={styles.errorModalTitle}>⚠️ Plating Failed</Text>
            <Text style={styles.errorModalMessage}>{processingError}</Text>
            <Text style={styles.errorModalSubtext}>
              Check inventory and retry individual orders.
            </Text>
            <TouchableOpacity
              onPress={() => setShowErrorModal(false)}
              style={styles.errorModalButton}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Recovery Panel */}
      <KDSErrorRecovery
        eventId={eventId}
        autoDetect={true}
        onRecoveryComplete={() => {
          setOrders(MOCK_PLATE_ORDERS);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KDS_COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KDS_COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: KDS_COLORS.plating,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  stationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: KDS_COLORS.plating,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    color: KDS_COLORS.text,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: KDS_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: KDS_COLORS.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: KDS_COLORS.border,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: KDS_COLORS.surfaceLight,
    borderColor: KDS_COLORS.plating,
  },
  filterTabText: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: KDS_COLORS.text,
  },
  batchButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: KDS_COLORS.ready,
    borderRadius: 8,
    alignItems: "center",
  },
  batchButtonDisabled: {
    opacity: 0.5,
  },
  batchButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  ordersList: {
    padding: 12,
    gap: 12,
  },
  plateCard: {
    flex: 1,
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KDS_COLORS.border,
    marginHorizontal: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  plateCardReady: {
    borderColor: KDS_COLORS.ready,
    borderWidth: 2,
  },
  plateCardUrgent: {
    borderColor: KDS_COLORS.urgent,
    backgroundColor: KDS_COLORS.surfaceLight,
  },
  plateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: KDS_COLORS.border,
  },
  plateInfo: {
    flex: 1,
  },
  tableNumber: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  tableGroup: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
  },
  plateMetaRight: {
    alignItems: "flex-end",
  },
  courseName: {
    color: KDS_COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  guestCount: {
    color: KDS_COLORS.textMuted,
    fontSize: 11,
  },
  statusBanner: {
    backgroundColor: KDS_COLORS.ready,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  statusBannerUrgent: {
    backgroundColor: KDS_COLORS.urgent,
  },
  statusBannerText: {
    color: KDS_COLORS.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  componentsList: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  componentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  componentReady: {
    backgroundColor: KDS_COLORS.surfaceLight,
  },
  componentStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkmark: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  waitingDot: {
    color: KDS_COLORS.text,
    fontSize: 16,
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    color: KDS_COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },
  componentStation: {
    color: KDS_COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  waitingLabel: {
    color: KDS_COLORS.warning,
    fontSize: 10,
    fontWeight: "bold",
  },
  plateButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: KDS_COLORS.ready,
    borderRadius: 6,
    alignItems: "center",
  },
  plateButtonDisabled: {
    opacity: 0.5,
  },
  plateButtonText: {
    color: KDS_COLORS.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  emptySubtitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: KDS_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: KDS_COLORS.border,
  },
  footerStat: {
    alignItems: "center",
  },
  footerStatValue: {
    color: KDS_COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerStatLabel: {
    color: KDS_COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorModal: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    borderLeftWidth: 4,
    borderLeftColor: KDS_COLORS.urgent,
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 14,
    color: KDS_COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorModalSubtext: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
    marginBottom: 16,
  },
  errorModalButton: {
    backgroundColor: KDS_COLORS.urgent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  errorModalButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
