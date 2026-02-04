import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { findUnprocessedOrderItems, retryInventoryDecrement } from "@/lib/kds-inventory-integration";

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

interface UnprocessedOrder {
  id: string;
  orderId: string;
  eventId: string;
  menuItemId: string;
  quantity: number;
  failedAt: Date;
  lastError?: string;
}

interface KDSErrorRecoveryProps {
  eventId: string;
  onRecoveryComplete?: () => void;
  autoDetect?: boolean;
}

export function KDSErrorRecovery({
  eventId,
  onRecoveryComplete,
  autoDetect = true,
}: KDSErrorRecoveryProps) {
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  const [unprocessedOrders, setUnprocessedOrders] = useState<UnprocessedOrder[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Auto-detect unprocessed orders on mount
  useEffect(() => {
    if (autoDetect) {
      scanForUnprocessedOrders();
    }
  }, [eventId, autoDetect]);

  const scanForUnprocessedOrders = async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      const unprocessed = await findUnprocessedOrderItems(eventId);
      setUnprocessedOrders(unprocessed);

      if (unprocessed.length > 0) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        setShowRecoveryPanel(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setScanError(errorMessage);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetryOrder = async (order: UnprocessedOrder) => {
    setRetryingId(order.id);

    try {
      const result = await retryInventoryDecrement(
        order.orderId,
        order.eventId,
        order.menuItemId,
        order.quantity
      );

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Remove from list
        setUnprocessedOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        Alert.alert("Retry Failed", result.message || "Could not retry this order");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert("Retry Error", `Failed to retry: ${errorMessage}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    setIsRetrying(true);

    let successCount = 0;
    let failureCount = 0;

    for (const order of unprocessedOrders) {
      try {
        const result = await retryInventoryDecrement(
          order.orderId,
          order.eventId,
          order.menuItemId,
          order.quantity
        );

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch {
        failureCount++;
      }
    }

    setIsRetrying(false);

    if (Platform.OS !== "web") {
      if (failureCount === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }

    Alert.alert(
      "Retry Complete",
      `${successCount} succeeded, ${failureCount} failed`,
      [
        {
          text: "OK",
          onPress: () => {
            if (failureCount === 0) {
              setShowRecoveryPanel(false);
              onRecoveryComplete?.();
            }
          },
        },
      ]
    );

    // Rescan to get updated list
    await scanForUnprocessedOrders();
  };

  const renderOrderItem = ({ item }: { item: UnprocessedOrder }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order {item.orderId}</Text>
        <Text style={styles.orderDetails}>
          Menu Item: {item.menuItemId} × {item.quantity}
        </Text>
        {item.lastError && (
          <Text style={styles.errorText}>Error: {item.lastError}</Text>
        )}
        <Text style={styles.failedTime}>
          Failed: {new Date(item.failedAt).toLocaleTimeString()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleRetryOrder(item)}
        style={[
          styles.retryButton,
          retryingId === item.id && styles.retryButtonProcessing,
        ]}
        disabled={isRetrying || retryingId === item.id}
      >
        {retryingId === item.id ? (
          <ActivityIndicator size="small" color={KDS_COLORS.text} />
        ) : (
          <Text style={styles.retryButtonText}>RETRY</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {/* Recovery Button (always visible if there are unprocessed orders) */}
      {unprocessedOrders.length > 0 && !showRecoveryPanel && (
        <TouchableOpacity
          onPress={() => setShowRecoveryPanel(true)}
          style={styles.recoveryButton}
        >
          <Text style={styles.recoveryButtonText}>
            ⚠️ {unprocessedOrders.length} UNPROCESSED ORDERS
          </Text>
        </TouchableOpacity>
      )}

      {/* Recovery Panel Modal */}
      <Modal
        visible={showRecoveryPanel}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (unprocessedOrders.length === 0) {
            setShowRecoveryPanel(false);
          }
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔧 INVENTORY RECOVERY</Text>
            <TouchableOpacity
              onPress={() => {
                if (unprocessedOrders.length === 0) {
                  setShowRecoveryPanel(false);
                }
              }}
              disabled={unprocessedOrders.length > 0}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scan Error */}
          {scanError && (
            <View style={styles.scanErrorBanner}>
              <Text style={styles.scanErrorText}>Scan Error: {scanError}</Text>
              <TouchableOpacity
                onPress={scanForUnprocessedOrders}
                style={styles.scanRetryButton}
              >
                <Text style={styles.scanRetryButtonText}>RETRY SCAN</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status */}
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>
              {isScanning ? "Scanning..." : `${unprocessedOrders.length} unprocessed orders`}
            </Text>
            <TouchableOpacity
              onPress={scanForUnprocessedOrders}
              disabled={isScanning}
              style={styles.scanButton}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={KDS_COLORS.text} />
              ) : (
                <Text style={styles.scanButtonText}>SCAN</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Orders List */}
          {unprocessedOrders.length > 0 ? (
            <>
              <FlatList
                data={unprocessedOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.ordersList}
                showsVerticalScrollIndicator={false}
              />

              {/* Action Buttons */}
              <View style={styles.actionBar}>
                <TouchableOpacity
                  onPress={handleRetryAll}
                  style={[
                    styles.retryAllButton,
                    (isRetrying || isScanning) && styles.retryAllButtonDisabled,
                  ]}
                  disabled={isRetrying || isScanning}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color={KDS_COLORS.text} />
                  ) : (
                    <Text style={styles.retryAllButtonText}>
                      🚀 RETRY ALL ({unprocessedOrders.length})
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowRecoveryPanel(false)}
                  style={styles.dismissButton}
                  disabled={isRetrying}
                >
                  <Text style={styles.dismissButtonText}>DISMISS</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyTitle}>ALL ORDERS PROCESSED</Text>
              <Text style={styles.emptySubtitle}>No unprocessed orders found</Text>
              <TouchableOpacity
                onPress={() => setShowRecoveryPanel(false)}
                style={styles.emptyCloseButton}
              >
                <Text style={styles.emptyCloseButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KDS_COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KDS_COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: KDS_COLORS.urgent,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: KDS_COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: KDS_COLORS.text,
    padding: 8,
  },
  scanErrorBanner: {
    backgroundColor: KDS_COLORS.urgent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scanErrorText: {
    color: KDS_COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  scanRetryButton: {
    backgroundColor: KDS_COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  scanRetryButtonText: {
    color: KDS_COLORS.urgent,
    fontSize: 11,
    fontWeight: "bold",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KDS_COLORS.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: KDS_COLORS.border,
  },
  statusText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  scanButton: {
    backgroundColor: KDS_COLORS.ready,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  scanButtonText: {
    color: KDS_COLORS.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  ordersList: {
    padding: 12,
    gap: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: KDS_COLORS.urgent,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderDetails: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  errorText: {
    color: KDS_COLORS.urgent,
    fontSize: 11,
    marginBottom: 4,
  },
  failedTime: {
    color: KDS_COLORS.textMuted,
    fontSize: 10,
  },
  retryButton: {
    backgroundColor: KDS_COLORS.ready,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  retryButtonProcessing: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: KDS_COLORS.text,
    fontSize: 11,
    fontWeight: "bold",
  },
  actionBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KDS_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: KDS_COLORS.border,
  },
  retryAllButton: {
    flex: 1,
    backgroundColor: KDS_COLORS.ready,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  retryAllButtonDisabled: {
    opacity: 0.5,
  },
  retryAllButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  dismissButton: {
    flex: 1,
    backgroundColor: KDS_COLORS.textMuted,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dismissButtonText: {
    color: KDS_COLORS.background,
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: KDS_COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  emptyCloseButton: {
    backgroundColor: KDS_COLORS.ready,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyCloseButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  recoveryButton: {
    backgroundColor: KDS_COLORS.urgent,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  recoveryButtonText: {
    color: KDS_COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
});
