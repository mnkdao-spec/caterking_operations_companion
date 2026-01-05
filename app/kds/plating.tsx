import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

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
  },
];

export default function PlatingStation() {
  const [orders, setOrders] = useState<PlateOrder[]>(MOCK_PLATE_ORDERS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "ready" | "waiting">("all");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlateComplete = (orderId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
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
          style={styles.plateButton}
          activeOpacity={0.8}
        >
          <Text style={styles.plateButtonText}>🍽️ PLATED & SERVED</Text>
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

      {/* Orders Grid */}
      <FlatList
        data={filteredOrders}
        renderItem={renderPlateOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        numColumns={2}
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
          <Text style={styles.footerStatLabel}>Waiting on Kitchen</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={styles.footerStatValue}>
            {orders.filter((o) => o.allReady && o.waitingTime >= 3).length}
          </Text>
          <Text style={styles.footerStatLabel}>Urgent (3m+)</Text>
        </View>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: KDS_COLORS.plating,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
  },
  backButtonText: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
  },
  stationTitle: {
    color: KDS_COLORS.plating,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeDisplay: {
    color: KDS_COLORS.text,
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: KDS_COLORS.border,
  },
  filterTabActive: {
    backgroundColor: KDS_COLORS.surfaceLight,
    borderColor: KDS_COLORS.text,
  },
  filterTabText: {
    color: KDS_COLORS.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  filterTabTextActive: {
    color: KDS_COLORS.text,
  },
  ordersList: {
    padding: 16,
  },
  plateCard: {
    flex: 1,
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 16,
    margin: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: KDS_COLORS.border,
  },
  plateCardReady: {
    borderColor: KDS_COLORS.ready,
  },
  plateCardUrgent: {
    borderColor: KDS_COLORS.urgent,
    borderWidth: 3,
  },
  plateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: KDS_COLORS.surfaceLight,
  },
  plateInfo: {},
  tableNumber: {
    color: KDS_COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  tableGroup: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  plateMetaRight: {
    alignItems: "flex-end",
  },
  courseName: {
    color: KDS_COLORS.fire,
    fontSize: 16,
    fontWeight: "700",
  },
  guestCount: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  statusBanner: {
    backgroundColor: KDS_COLORS.ready,
    paddingVertical: 12,
    alignItems: "center",
  },
  statusBannerUrgent: {
    backgroundColor: KDS_COLORS.urgent,
  },
  statusBannerText: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  componentsList: {
    padding: 12,
  },
  componentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: KDS_COLORS.background,
  },
  componentReady: {
    backgroundColor: KDS_COLORS.ready + "20",
  },
  componentStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkmark: {
    color: KDS_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  waitingDot: {
    color: KDS_COLORS.text,
    fontSize: 18,
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  componentStation: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  waitingLabel: {
    color: KDS_COLORS.warning,
    fontSize: 12,
    fontWeight: "700",
  },
  plateButton: {
    backgroundColor: KDS_COLORS.plating,
    paddingVertical: 20,
    alignItems: "center",
  },
  plateButtonText: {
    color: KDS_COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 24,
    fontWeight: "800",
  },
  emptySubtitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 2,
    borderTopColor: KDS_COLORS.border,
    backgroundColor: KDS_COLORS.surface,
  },
  footerStat: {
    alignItems: "center",
  },
  footerStatValue: {
    color: KDS_COLORS.text,
    fontSize: 32,
    fontWeight: "800",
  },
  footerStatLabel: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
