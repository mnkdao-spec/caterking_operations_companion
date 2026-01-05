import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
};

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  tableGroup: string;
  tableNumber: number;
  modifications: string[];
  firedAt: Date;
  course: string;
}

// Mock data for different stations
const generateMockOrders = (stationType: string): OrderItem[] => {
  const baseOrders: Record<string, OrderItem[]> = {
    grill: [
      {
        id: "g1",
        name: "Ribeye Steak",
        quantity: 4,
        tableGroup: "Tables 1-4",
        tableNumber: 2,
        modifications: ["Medium-Rare", "No pepper"],
        firedAt: new Date(Date.now() - 6 * 60000),
        course: "Main Course",
      },
      {
        id: "g2",
        name: "Grilled Salmon",
        quantity: 3,
        tableGroup: "Tables 1-4",
        tableNumber: 3,
        modifications: ["Well done"],
        firedAt: new Date(Date.now() - 4 * 60000),
        course: "Main Course",
      },
      {
        id: "g3",
        name: "Lamb Chops",
        quantity: 2,
        tableGroup: "Tables 5-8",
        tableNumber: 6,
        modifications: ["Medium"],
        firedAt: new Date(Date.now() - 2 * 60000),
        course: "Main Course",
      },
      {
        id: "g4",
        name: "Grilled Chicken",
        quantity: 5,
        tableGroup: "Tables 9-12",
        tableNumber: 10,
        modifications: [],
        firedAt: new Date(Date.now() - 1 * 60000),
        course: "Main Course",
      },
    ],
    saute: [
      {
        id: "s1",
        name: "Mushroom Risotto",
        quantity: 3,
        tableGroup: "Tables 1-4",
        tableNumber: 1,
        modifications: ["Extra truffle"],
        firedAt: new Date(Date.now() - 5 * 60000),
        course: "Main Course",
      },
      {
        id: "s2",
        name: "Shrimp Scampi",
        quantity: 2,
        tableGroup: "Tables 5-8",
        tableNumber: 7,
        modifications: ["No garlic"],
        firedAt: new Date(Date.now() - 3 * 60000),
        course: "Main Course",
      },
      {
        id: "s3",
        name: "Vegetable Stir Fry",
        quantity: 4,
        tableGroup: "Tables 9-12",
        tableNumber: 11,
        modifications: ["Vegan"],
        firedAt: new Date(Date.now() - 1 * 60000),
        course: "Main Course",
      },
    ],
    garde_manger: [
      {
        id: "gm1",
        name: "Caesar Salad",
        quantity: 8,
        tableGroup: "Tables 5-8",
        tableNumber: 5,
        modifications: ["Dressing on side"],
        firedAt: new Date(Date.now() - 2 * 60000),
        course: "Salads",
      },
      {
        id: "gm2",
        name: "Caprese",
        quantity: 4,
        tableGroup: "Tables 5-8",
        tableNumber: 8,
        modifications: [],
        firedAt: new Date(Date.now() - 1 * 60000),
        course: "Salads",
      },
    ],
    dessert: [
      {
        id: "d1",
        name: "Chocolate Lava Cake",
        quantity: 6,
        tableGroup: "Tables 1-4",
        tableNumber: 2,
        modifications: [],
        firedAt: new Date(Date.now() - 3 * 60000),
        course: "Dessert",
      },
    ],
  };

  return baseOrders[stationType] || [];
};

export default function StationDisplay() {
  const params = useLocalSearchParams<{ stationType: string; stationName: string }>();
  const stationType = params.stationType || "grill";
  const stationName = params.stationName || "GRILL";

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bumpingId, setBumpingId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(generateMockOrders(stationType));
  }, [stationType]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedMinutes = (firedAt: Date) => {
    return Math.floor((currentTime.getTime() - firedAt.getTime()) / 60000);
  };

  const getTimerColor = (minutes: number) => {
    if (minutes >= 8) return KDS_COLORS.urgent;
    if (minutes >= 5) return KDS_COLORS.warning;
    return KDS_COLORS.ready;
  };

  const handleBump = useCallback((orderId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setBumpingId(orderId);

    setTimeout(() => {
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setBumpingId(null);
    }, 300);
  }, []);

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const getStationColor = () => {
    switch (stationType) {
      case "grill":
        return "#E74C3C";
      case "saute":
        return "#F39C12";
      case "garde_manger":
        return "#27AE60";
      case "dessert":
        return "#9B59B6";
      default:
        return KDS_COLORS.fire;
    }
  };

  const renderOrderCard = ({ item, index }: { item: OrderItem; index: number }) => {
    const elapsedMinutes = getElapsedMinutes(item.firedAt);
    const timerColor = getTimerColor(elapsedMinutes);
    const isBumping = bumpingId === item.id;
    const isOldest = index === 0;

    return (
      <Animated.View
        style={[
          styles.orderCard,
          isOldest && styles.orderCardOldest,
          isBumping && styles.orderCardBumping,
          { borderLeftColor: timerColor },
        ]}
      >
        {/* Timer Badge */}
        <View style={[styles.timerBadge, { backgroundColor: timerColor }]}>
          <Text style={styles.timerText}>{elapsedMinutes}m</Text>
        </View>

        {/* Order Content */}
        <View style={styles.orderContent}>
          {/* Header Row */}
          <View style={styles.orderHeader}>
            <Text style={styles.orderQuantity}>×{item.quantity}</Text>
            <Text style={styles.orderName}>{item.name}</Text>
          </View>

          {/* Table Info */}
          <View style={styles.tableInfo}>
            <Text style={styles.tableGroup}>{item.tableGroup}</Text>
            <Text style={styles.tableNumber}>Table {item.tableNumber}</Text>
            <Text style={styles.courseName}>{item.course}</Text>
          </View>

          {/* Modifications */}
          {item.modifications.length > 0 && (
            <View style={styles.modifications}>
              {item.modifications.map((mod, idx) => (
                <View key={idx} style={styles.modBadge}>
                  <Text style={styles.modText}>⚠️ {mod}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* BUMP Button */}
        <TouchableOpacity
          onPress={() => handleBump(item.id)}
          style={[styles.bumpButton, isBumping && styles.bumpButtonPressed]}
          activeOpacity={0.8}
        >
          <Text style={styles.bumpButtonText}>BUMP</Text>
          <Text style={styles.bumpButtonSubtext}>TAP WHEN DONE</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const stationColor = getStationColor();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: stationColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← STATIONS</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.stationTitle, { color: stationColor }]}>
            {stationName} STATION
          </Text>
          <Text style={styles.queueCount}>
            {orders.length} {orders.length === 1 ? "ORDER" : "ORDERS"} IN QUEUE
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeDisplay}>
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>

      {/* Order Queue */}
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.orderList}
          showsVerticalScrollIndicator={false}
          numColumns={SCREEN_WIDTH > 1000 ? 2 : 1}
          key={SCREEN_WIDTH > 1000 ? "2col" : "1col"}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>ALL CAUGHT UP</Text>
          <Text style={styles.emptySubtitle}>No orders in queue</Text>
        </View>
      )}

      {/* Footer Stats */}
      <View style={styles.footer}>
        <View style={styles.footerStat}>
          <Text style={styles.footerStatValue}>{orders.length}</Text>
          <Text style={styles.footerStatLabel}>Pending</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={[styles.footerStatValue, { color: KDS_COLORS.bump }]}>
            {12 - orders.length}
          </Text>
          <Text style={styles.footerStatLabel}>Completed</Text>
        </View>
        <View style={styles.footerStat}>
          <Text
            style={[
              styles.footerStatValue,
              orders.some((o) => getElapsedMinutes(o.firedAt) >= 8) && {
                color: KDS_COLORS.urgent,
              },
            ]}
          >
            {orders.length > 0
              ? Math.max(...orders.map((o) => getElapsedMinutes(o.firedAt)))
              : 0}
            m
          </Text>
          <Text style={styles.footerStatLabel}>Oldest</Text>
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
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 2,
  },
  queueCount: {
    color: KDS_COLORS.textMuted,
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeDisplay: {
    color: KDS_COLORS.text,
    fontSize: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  orderList: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    flex: 1,
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 16,
    borderLeftWidth: 8,
    margin: 8,
    overflow: "hidden",
  },
  orderCardOldest: {
    borderWidth: 2,
    borderColor: KDS_COLORS.warning,
  },
  orderCardBumping: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  timerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  timerText: {
    color: KDS_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  orderContent: {
    padding: 20,
    paddingBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 12,
  },
  orderQuantity: {
    color: KDS_COLORS.text,
    fontSize: 48,
    fontWeight: "900",
  },
  orderName: {
    color: KDS_COLORS.text,
    fontSize: 28,
    fontWeight: "700",
    flex: 1,
  },
  tableInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  tableGroup: {
    color: KDS_COLORS.textMuted,
    fontSize: 16,
  },
  tableNumber: {
    color: KDS_COLORS.fire,
    fontSize: 16,
    fontWeight: "700",
  },
  courseName: {
    color: KDS_COLORS.textMuted,
    fontSize: 16,
  },
  modifications: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modBadge: {
    backgroundColor: KDS_COLORS.warning + "30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modText: {
    color: KDS_COLORS.warning,
    fontSize: 14,
    fontWeight: "600",
  },
  bumpButton: {
    backgroundColor: KDS_COLORS.bump,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bumpButtonPressed: {
    backgroundColor: KDS_COLORS.ready,
  },
  bumpButtonText: {
    color: KDS_COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
  },
  bumpButtonSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    color: KDS_COLORS.ready,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 2,
  },
  emptySubtitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 18,
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
    fontSize: 14,
    marginTop: 4,
  },
});
