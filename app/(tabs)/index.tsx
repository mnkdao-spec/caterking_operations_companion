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
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

type EventStatus = "in_progress" | "upcoming" | "completed";

interface CateringEvent {
  id: string;
  name: string;
  client: string;
  time: string;
  guests: number;
  venue: string;
  status: EventStatus;
  revenue: string;
  type: string;
}

const MOCK_EVENTS: CateringEvent[] = [
  {
    id: "1",
    name: "Corporate Lunch",
    client: "TechCorp Industries",
    time: "12:00 PM",
    guests: 45,
    venue: "TechCorp HQ, Floor 12",
    status: "in_progress",
    revenue: "$2,340",
    type: "Corporate",
  },
  {
    id: "2",
    name: "Wedding Reception",
    client: "Johnson Family",
    time: "6:00 PM",
    guests: 120,
    venue: "Riverside Gardens",
    status: "upcoming",
    revenue: "$8,500",
    type: "Wedding",
  },
  {
    id: "3",
    name: "Birthday Party",
    client: "Smith Residence",
    time: "3:00 PM",
    guests: 25,
    venue: "Private Residence",
    status: "upcoming",
    revenue: "$1,200",
    type: "Private",
  },
  {
    id: "4",
    name: "Product Launch",
    client: "StartupXYZ",
    time: "10:00 AM",
    guests: 80,
    venue: "Innovation Center",
    status: "completed",
    revenue: "$4,200",
    type: "Corporate",
  },
];

export default function TodayScreen() {
  const colors = useColors();
  const [events, setEvents] = useState<CateringEvent[]>(MOCK_EVENTS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CateringEvent | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case "in_progress":
        return colors.primary;
      case "upcoming":
        return colors.warning;
      case "completed":
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: EventStatus) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const handleEventPress = (event: CateringEvent) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
  };

  const handleEnterKDS = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    router.push("/kds" as any);
  };

  const renderEventCard = ({ item }: { item: CateringEvent }) => {
    const isExpanded = selectedEvent?.id === item.id;
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        onPress={() => handleEventPress(item)}
        activeOpacity={0.7}
        style={[
          styles.eventCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Status indicator bar */}
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

        <View style={styles.cardContent}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.eventName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Text style={[styles.clientName, { color: colors.muted }]}>
                {item.client}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          {/* Info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconSymbol name="clock.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {item.time}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="person.2.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {item.guests} guests
              </Text>
            </View>
          </View>

          {/* Expanded details */}
          {isExpanded && (
            <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
              <View style={styles.detailRow}>
                <IconSymbol name="location.fill" size={16} color={colors.muted} />
                <Text style={[styles.detailText, { color: colors.foreground }]}>
                  {item.venue}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.revenueLabel, { color: colors.muted }]}>
                  Revenue:
                </Text>
                <Text style={[styles.revenueValue, { color: colors.primary }]}>
                  {item.revenue}
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                {item.status === "upcoming" && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>Start Prep</Text>
                  </TouchableOpacity>
                )}
                {item.status === "in_progress" && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryButton,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                    View Checklist
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const inProgressCount = events.filter((e) => e.status === "in_progress").length;
  const upcomingCount = events.filter((e) => e.status === "upcoming").length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Today's Events
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleEnterKDS}
            style={[styles.kdsButton, { backgroundColor: "#1A1A1A" }]}
          >
            <Text style={styles.kdsButtonText}>🍽️ KDS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            {inProgressCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>
            In Progress
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.warning + "15" },
          ]}
        >
          <Text style={[styles.summaryNumber, { color: colors.warning }]}>
            {upcomingCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.warning }]}>
            Upcoming
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.success + "15" },
          ]}
        >
          <Text style={[styles.summaryNumber, { color: colors.success }]}>
            {events.filter((e) => e.status === "completed").length}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.success }]}>
            Completed
          </Text>
        </View>
      </View>

      {/* Events list */}
      <FlatList
        data={events}
        renderItem={renderEventCard}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kdsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  kdsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  eventCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    flexDirection: "row",
  },
  statusBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
  },
  clientName: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
