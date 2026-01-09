import { useState, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Mock low stock alerts
interface LowStockAlert {
  id: string;
  ingredient: string;
  currentLevel: number;
  reorderLevel: number;
  unit: string;
  severity: "warning" | "critical";
  timestamp: string;
}

const MOCK_ALERTS: LowStockAlert[] = [
  {
    id: "1",
    ingredient: "Salmon Fillet",
    currentLevel: 3,
    reorderLevel: 4,
    unit: "lb",
    severity: "warning",
    timestamp: "2 min ago",
  },
  {
    id: "2",
    ingredient: "Fresh Basil",
    currentLevel: 0.5,
    reorderLevel: 2,
    unit: "bunch",
    severity: "critical",
    timestamp: "5 min ago",
  },
  {
    id: "3",
    ingredient: "Chicken Breast",
    currentLevel: 0,
    reorderLevel: 6,
    unit: "lb",
    severity: "critical",
    timestamp: "15 min ago",
  },
];

export default function LowStockAlertsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [alerts, setAlerts] = useState<LowStockAlert[]>(MOCK_ALERTS);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const handleAcknowledge = (alertId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAcknowledged((prev) => new Set(prev).add(alertId));
  };

  const handleReorder = (ingredient: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "Reorder",
      `Mark ${ingredient} as reordered?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            Alert.alert("Success", `${ingredient} reorder confirmed`);
          },
        },
      ]
    );
  };

  const renderAlertItem = ({ item }: { item: LowStockAlert }) => {
    const isAcknowledged = acknowledged.has(item.id);
    const isCritical = item.severity === "critical";
    const bgColor = isCritical ? colors.error : colors.warning;

    return (
      <View
        style={[
          styles.alertCard,
          {
            backgroundColor: colors.surface,
            borderLeftColor: bgColor,
            borderLeftWidth: 4,
            opacity: isAcknowledged ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleSection}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>
              {item.ingredient}
            </Text>
            <Text style={[styles.alertTime, { color: colors.muted }]}>
              {item.timestamp}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: bgColor + "20" }]}>
            <Text style={[styles.severityText, { color: bgColor }]}>
              {isCritical ? "CRITICAL" : "WARNING"}
            </Text>
          </View>
        </View>

        {/* Stock Level */}
        <View style={styles.stockInfo}>
          <View style={styles.stockLevel}>
            <Text style={[styles.stockValue, { color: colors.foreground }]}>
              {item.currentLevel}
            </Text>
            <Text style={[styles.stockUnit, { color: colors.muted }]}>
              {item.unit}
            </Text>
          </View>
          <Text style={[styles.stockLabel, { color: colors.muted }]}>
            Current
          </Text>
        </View>

        <View style={styles.stockInfo}>
          <View style={styles.stockLevel}>
            <Text style={[styles.stockValue, { color: colors.muted }]}>
              {item.reorderLevel}
            </Text>
            <Text style={[styles.stockUnit, { color: colors.muted }]}>
              {item.unit}
            </Text>
          </View>
          <Text style={[styles.stockLabel, { color: colors.muted }]}>
            Reorder Level
          </Text>
        </View>

        {/* Action Buttons */}
        {!isAcknowledged && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.border },
              ]}
              onPress={() => handleAcknowledge(item.id)}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                Acknowledge
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: bgColor }]}
              onPress={() => handleReorder(item.ingredient)}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                Reorder Now
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const unacknowledgedCount = alerts.filter((a) => !acknowledged.has(a.id)).length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Low Stock Alerts
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          {unacknowledgedCount} unacknowledged
        </Text>
      </View>

      {/* Alert Count Badge */}
      {unacknowledgedCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={[styles.alertBannerText, { color: "#FFFFFF" }]}>
            ⚠️ {unacknowledgedCount} alert{unacknowledgedCount !== 1 ? "s" : ""} require{unacknowledgedCount !== 1 ? "" : "s"} attention
          </Text>
        </View>
      )}

      {/* Alerts List */}
      {alerts.length > 0 ? (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.muted }]}>
            ✓ All inventory levels are good
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  alertBanner: {
    backgroundColor: "#DC2626",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  alertBannerText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  alertCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  alertTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  alertTime: {
    fontSize: 12,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stockInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  stockLevel: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  stockValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  stockUnit: {
    fontSize: 14,
  },
  stockLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#0a7ea4",
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
