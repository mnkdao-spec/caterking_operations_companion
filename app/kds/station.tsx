import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
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
import { handleOrderItemCompletion } from "@/lib/kds-inventory-integration";
import { KDSErrorRecovery } from "@/components/kds-error-recovery";

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
  menuItemId?: string; // For inventory tracking
  eventId?: string; // For inventory tracking
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
        menuItemId: "menu-ribeye",
        eventId: "event-wedding",
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
        menuItemId: "menu-salmon",
        eventId: "event-wedding",
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
        menuItemId: "menu-lamb",
        eventId: "event-wedding",
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
        menuItemId: "menu-chicken",
        eventId: "event-wedding",
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
        menuItemId: "menu-risotto",
        eventId: "event-wedding",
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
        menuItemId: "menu-scampi",
        eventId: "event-wedding",
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
        menuItemId: "menu-stirfry",
        eventId: "event-wedding",
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
        menuItemId: "menu-caesar",
        eventId: "event-wedding",
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
        menuItemId: "menu-caprese",
        eventId: "event-wedding",
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
        menuItemId: "menu-lava",
        eventId: "event-wedding",
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [eventId] = useState("event-wedding"); // From navigation params in real app

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

  const handleBump = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      // Show processing state
      setIsProcessing(true);
      setBumpingId(orderId);
      setProcessingError(null);

      try {
        // Call new inventory transaction system
        const result = await handleOrderItemCompletion(
          orderId,
          order.eventId || "event-default",
          order.menuItemId || "menu-item-default",
          order.quantity
        );

        if (result.success) {
          // Haptic feedback for success
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          // Remove order from queue with animation
          setTimeout(() => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            setBumpingId(null);
            setIsProcessing(false);
          }, 300);
        } else {
          // Show error to operator
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          setProcessingError(result.message);
          setShowErrorModal(true);
          setBumpingId(null);
          setIsProcessing(false);
        }
      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setProcessingError(`Failed to complete order: ${errorMessage}`);
        setShowErrorModal(true);
        setBumpingId(null);
        setIsProcessing(false);
      }
    },
    [orders]
  );

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
    const isDisabled = isProcessing && isBumping;

    return (
      <Animated.View
        style={[
          styles.orderCard,
          isOldest && styles.orderCardOldest,
          isBumping && styles.orderCardBumping,
          isDisabled && styles.orderCardDisabled,
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

        {/* BUMP Button with Loading State */}
        <TouchableOpacity
          onPress={() => handleBump(item.id)}
          style={[
            styles.bumpButton,
            isBumping && styles.bumpButtonPressed,
            isDisabled && styles.bumpButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={isDisabled}
        >
          {isDisabled ? (
            <ActivityIndicator size="small" color={KDS_COLORS.text} />
          ) : (
            <>
              <Text style={styles.bumpButtonText}>BUMP</Text>
              <Text style={styles.bumpButtonSubtext}>TAP WHEN DONE</Text>
            </>
          )}
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
          scrollEnabled={!isProcessing}
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
            <Text style={styles.errorModalTitle}>⚠️ Order Completion Failed</Text>
            <Text style={styles.errorModalMessage}>{processingError}</Text>
            <Text style={styles.errorModalSubtext}>
              The order status has been reverted. Please check inventory and retry.
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
          setOrders(generateMockOrders(stationType));
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
    borderBottomWidth: 3,
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  queueCount: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: "bold",
    color: KDS_COLORS.text,
  },
  orderList: {
    padding: 12,
    gap: 12,
  },
  orderCard: {
    flexDirection: "row",
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  orderCardOldest: {
    borderWidth: 2,
    borderColor: KDS_COLORS.urgent,
  },
  orderCardBumping: {
    backgroundColor: KDS_COLORS.ready,
  },
  orderCardDisabled: {
    opacity: 0.6,
  },
  timerBadge: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  timerText: {
    color: KDS_COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  orderContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderQuantity: {
    color: KDS_COLORS.warning,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  orderName: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  tableInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  tableGroup: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
  },
  tableNumber: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
  },
  courseName: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
  },
  modifications: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  modBadge: {
    backgroundColor: KDS_COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modText: {
    color: KDS_COLORS.warning,
    fontSize: 11,
    fontWeight: "500",
  },
  bumpButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: KDS_COLORS.bump,
    paddingHorizontal: 8,
  },
  bumpButtonPressed: {
    backgroundColor: KDS_COLORS.ready,
  },
  bumpButtonDisabled: {
    opacity: 0.5,
  },
  bumpButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  bumpButtonSubtext: {
    color: KDS_COLORS.text,
    fontSize: 10,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: KDS_COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  emptySubtitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: "bold",
  },
  footerStatLabel: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
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
