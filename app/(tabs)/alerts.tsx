import { useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type AlertType = "warning" | "success" | "info" | "error";

interface KitchenAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
  event?: string;
  isRead: boolean;
}

const MOCK_ALERTS: KitchenAlert[] = [
  {
    id: "1",
    type: "warning",
    title: "Low Inventory",
    message: "Salmon stock is running low (2 portions remaining)",
    time: "5 min ago",
    event: "Corporate Lunch",
    isRead: false,
  },
  {
    id: "2",
    type: "success",
    title: "Prep Completed",
    message: "Appetizers for Johnson Wedding are ready",
    time: "15 min ago",
    event: "Wedding Reception",
    isRead: false,
  },
  {
    id: "3",
    type: "info",
    title: "New Order",
    message: "Additional 10 vegetarian meals requested",
    time: "32 min ago",
    event: "Corporate Lunch",
    isRead: true,
  },
  {
    id: "4",
    type: "warning",
    title: "Equipment Alert",
    message: "Oven 2 temperature fluctuating - check calibration",
    time: "1 hour ago",
    isRead: true,
  },
  {
    id: "5",
    type: "success",
    title: "Delivery Confirmed",
    message: "Fresh produce delivery arrived and checked in",
    time: "2 hours ago",
    isRead: true,
  },
  {
    id: "6",
    type: "error",
    title: "Allergen Alert",
    message: "Guest at Table 5 has severe nut allergy - verify all dishes",
    time: "3 hours ago",
    event: "Birthday Party",
    isRead: true,
  },
];

type FilterType = "all" | "warning" | "success" | "info" | "error";

export default function AlertsScreen() {
  const colors = useColors();
  const [alerts, setAlerts] = useState<KitchenAlert[]>(MOCK_ALERTS);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case "warning":
        return colors.warning;
      case "success":
        return colors.success;
      case "info":
        return colors.primary;
      case "error":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "warning":
        return "exclamationmark.triangle.fill";
      case "success":
        return "checkmark.circle.fill";
      case "info":
        return "info.circle.fill";
      case "error":
        return "xmark.circle.fill";
      default:
        return "info.circle.fill";
    }
  };

  const handleDismiss = (alertId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const filteredAlerts =
    filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const renderFilterButton = (filterType: FilterType, label: string) => {
    const isActive = filter === filterType;
    return (
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setFilter(filterType);
        }}
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.filterButtonText,
            { color: isActive ? "#FFFFFF" : colors.foreground },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAlertItem = ({ item }: { item: KitchenAlert }) => {
    const alertColor = getAlertColor(item.type);
    const iconName = getAlertIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleDismiss(item.id)}
        activeOpacity={0.7}
        style={[
          styles.alertCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: item.isRead ? 0.7 : 1,
          },
        ]}
      >
        {/* Left color indicator */}
        <View style={[styles.alertIndicator, { backgroundColor: alertColor }]} />

        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: alertColor + "20" },
          ]}
        >
          <IconSymbol
            name={iconName as any}
            size={24}
            color={alertColor}
          />
        </View>

        {/* Content */}
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>
              {item.title}
            </Text>
            {!item.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text style={[styles.alertMessage, { color: colors.muted }]}>
            {item.message}
          </Text>
          <View style={styles.alertMeta}>
            <Text style={[styles.alertTime, { color: colors.muted }]}>
              {item.time}
            </Text>
            {item.event && (
              <View style={styles.eventTag}>
                <Text style={[styles.eventTagText, { color: colors.primary }]}>
                  {item.event}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Kitchen Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          Real-time updates from the kitchen
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {renderFilterButton("all", "All")}
        {renderFilterButton("warning", "Warnings")}
        {renderFilterButton("success", "Success")}
        {renderFilterButton("info", "Info")}
      </View>

      {/* Alerts list */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={48}
              color={colors.muted}
            />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No alerts to show
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  alertCard: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  alertIndicator: {
    width: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    margin: 12,
  },
  alertContent: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertMessage: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  alertTime: {
    fontSize: 12,
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(217, 119, 6, 0.1)",
  },
  eventTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
