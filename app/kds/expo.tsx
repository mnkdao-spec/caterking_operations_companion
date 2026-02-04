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
import { handleCourseCompletion } from "@/lib/kds-inventory-integration";
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
};

interface TableGroup {
  id: string;
  name: string;
  guestCount: number;
  courses: CourseStatus[];
  eventId?: string; // For inventory tracking
}

interface CourseStatus {
  courseNumber: number;
  name: string;
  status: "pending" | "fired" | "in_progress" | "ready" | "served";
  itemCount: number;
  readyCount: number;
  firedAt?: Date;
  menuItemIds?: string[]; // For inventory tracking
}

interface StationStatus {
  id: string;
  name: string;
  queueCount: number;
  oldestItemMinutes: number;
  status: "idle" | "active" | "behind";
}

// Mock data
const MOCK_TABLE_GROUPS: TableGroup[] = [
  {
    id: "1",
    name: "Tables 1-4",
    guestCount: 32,
    eventId: "event-wedding",
    courses: [
      { courseNumber: 1, name: "Appetizers", status: "served", itemCount: 4, readyCount: 4, menuItemIds: ["menu-app1", "menu-app2"] },
      { courseNumber: 2, name: "Salads", status: "ready", itemCount: 3, readyCount: 3, menuItemIds: ["menu-salad1"] },
      { courseNumber: 3, name: "Main Course", status: "in_progress", itemCount: 5, readyCount: 2, menuItemIds: ["menu-main1", "menu-main2"] },
      { courseNumber: 4, name: "Dessert", status: "pending", itemCount: 2, readyCount: 0, menuItemIds: ["menu-dessert1"] },
    ],
  },
  {
    id: "2",
    name: "Tables 5-8",
    guestCount: 28,
    eventId: "event-wedding",
    courses: [
      { courseNumber: 1, name: "Appetizers", status: "served", itemCount: 4, readyCount: 4, menuItemIds: ["menu-app1", "menu-app2"] },
      { courseNumber: 2, name: "Salads", status: "fired", itemCount: 3, readyCount: 0, menuItemIds: ["menu-salad1"] },
      { courseNumber: 3, name: "Main Course", status: "pending", itemCount: 5, readyCount: 0, menuItemIds: ["menu-main1", "menu-main2"] },
      { courseNumber: 4, name: "Dessert", status: "pending", itemCount: 2, readyCount: 0, menuItemIds: ["menu-dessert1"] },
    ],
  },
  {
    id: "3",
    name: "Tables 9-12",
    guestCount: 36,
    eventId: "event-wedding",
    courses: [
      { courseNumber: 1, name: "Appetizers", status: "in_progress", itemCount: 4, readyCount: 2, menuItemIds: ["menu-app1", "menu-app2"] },
      { courseNumber: 2, name: "Salads", status: "pending", itemCount: 3, readyCount: 0, menuItemIds: ["menu-salad1"] },
      { courseNumber: 3, name: "Main Course", status: "pending", itemCount: 5, readyCount: 0, menuItemIds: ["menu-main1", "menu-main2"] },
      { courseNumber: 4, name: "Dessert", status: "pending", itemCount: 2, readyCount: 0, menuItemIds: ["menu-dessert1"] },
    ],
  },
];

const MOCK_STATIONS: StationStatus[] = [
  { id: "grill", name: "GRILL", queueCount: 8, oldestItemMinutes: 6, status: "active" },
  { id: "saute", name: "SAUTÉ", queueCount: 5, oldestItemMinutes: 3, status: "active" },
  { id: "garde", name: "GARDE", queueCount: 2, oldestItemMinutes: 1, status: "idle" },
  { id: "dessert", name: "DESSERT", queueCount: 0, oldestItemMinutes: 0, status: "idle" },
  { id: "plating", name: "PLATING", queueCount: 3, oldestItemMinutes: 2, status: "active" },
];

export default function ExpoStation() {
  const [eventId] = useState("event-wedding"); // From navigation params in real app
  const { tableGroups: liveTableGroups, stations: liveStations, loading, error } = useKDSRealtimeData(eventId);
  const [tableGroups, setTableGroups] = useState<TableGroup[]>(MOCK_TABLE_GROUPS);
  const [stations, setStations] = useState<StationStatus[]>(MOCK_STATIONS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [processingCourse, setProcessingCourse] = useState<string | null>(null);

  // Use live data when available, fallback to mock data
  useEffect(() => {
    if (!loading && liveTableGroups.length > 0) {
      setTableGroups(liveTableGroups as any);
    }
    if (!loading && liveStations.length > 0) {
      setStations(liveStations as any);
    }
  }, [liveTableGroups, liveStations, loading])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFireCourse = (tableGroupId: string, courseNumber: number) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setTableGroups((prev) =>
      prev.map((group) => {
        if (group.id === tableGroupId) {
          return {
            ...group,
            courses: group.courses.map((course) =>
              course.courseNumber === courseNumber
                ? { ...course, status: "fired" as const, firedAt: new Date() }
                : course
            ),
          };
        }
        return group;
      })
    );
  };

  const handleMarkServed = async (tableGroupId: string, courseNumber: number) => {
    const tableGroup = tableGroups.find((g) => g.id === tableGroupId);
    const course = tableGroup?.courses.find((c) => c.courseNumber === courseNumber);

    if (!tableGroup || !course) return;

    setIsProcessing(true);
    setProcessingCourse(`${tableGroupId}-${courseNumber}`);
    setProcessingError(null);

    try {
      // Call inventory transaction system for course completion
      const result = await handleCourseCompletion(
        `course-${tableGroupId}-${courseNumber}`,
        tableGroup.eventId || "event-default",
        course.menuItemIds || [],
        course.itemCount
      );

      if (result.success) {
        // Haptic feedback for success
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Update course status
        setTableGroups((prev) =>
          prev.map((group) => {
            if (group.id === tableGroupId) {
              return {
                ...group,
                courses: group.courses.map((c) =>
                  c.courseNumber === courseNumber
                    ? { ...c, status: "served" as const }
                    : c
                ),
              };
            }
            return group;
          })
        );
      } else {
        // Show error to operator
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setProcessingError(result.message);
        setShowErrorModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setProcessingError(`Failed to mark course served: ${errorMessage}`);
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
      setProcessingCourse(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return KDS_COLORS.textMuted;
      case "fired":
        return KDS_COLORS.fire;
      case "in_progress":
        return KDS_COLORS.warning;
      case "ready":
        return KDS_COLORS.ready;
      case "served":
        return KDS_COLORS.bump;
      default:
        return KDS_COLORS.textMuted;
    }
  };

  const getStationStatusColor = (status: string) => {
    switch (status) {
      case "idle":
        return KDS_COLORS.textMuted;
      case "active":
        return KDS_COLORS.ready;
      case "behind":
        return KDS_COLORS.urgent;
      default:
        return KDS_COLORS.textMuted;
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const renderCourseRow = (course: CourseStatus, tableGroupId: string) => {
    const canFire = course.status === "pending";
    const canServe = course.status === "ready";
    const isActive = course.status === "fired" || course.status === "in_progress";
    const isProcessingThisCourse = processingCourse === `${tableGroupId}-${course.courseNumber}`;

    return (
      <View key={course.courseNumber} style={styles.courseRow}>
        <View style={styles.courseInfo}>
          <Text style={[styles.courseName, { color: getStatusColor(course.status) }]}>
            {course.name}
          </Text>
          <Text style={styles.courseProgress}>
            {course.readyCount}/{course.itemCount} ready
          </Text>
        </View>

        <View style={styles.courseStatus}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(course.status) },
            ]}
          />
          <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>
            {course.status.toUpperCase().replace("_", " ")}
          </Text>
        </View>

        <View style={styles.courseActions}>
          {canFire && (
            <TouchableOpacity
              onPress={() => handleFireCourse(tableGroupId, course.courseNumber)}
              style={styles.fireButton}
              disabled={isProcessing}
            >
              <Text style={styles.fireButtonText}>🔥 FIRE</Text>
            </TouchableOpacity>
          )}
          {canServe && (
            <TouchableOpacity
              onPress={() => handleMarkServed(tableGroupId, course.courseNumber)}
              style={[
                styles.serveButton,
                isProcessingThisCourse && styles.serveButtonProcessing,
              ]}
              disabled={isProcessing}
            >
              {isProcessingThisCourse ? (
                <ActivityIndicator size="small" color={KDS_COLORS.text} />
              ) : (
                <Text style={styles.serveButtonText}>✓ SERVED</Text>
              )}
            </TouchableOpacity>
          )}
          {isActive && (
            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>IN KITCHEN</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTableGroup = ({ item }: { item: TableGroup }) => (
    <View style={styles.tableGroupCard}>
      <View style={styles.tableGroupHeader}>
        <Text style={styles.tableGroupName}>{item.name}</Text>
        <Text style={styles.guestCount}>{item.guestCount} guests</Text>
      </View>
      <View style={styles.coursesContainer}>
        {item.courses.map((course) => renderCourseRow(course, item.id))}
      </View>
    </View>
  );

  const renderStationStatus = (station: StationStatus) => (
    <View
      key={station.id}
      style={[
        styles.stationCard,
        station.oldestItemMinutes > 5 && styles.stationCardWarning,
      ]}
    >
      <Text style={styles.stationName}>{station.name}</Text>
      <Text style={[styles.stationQueue, { color: getStationStatusColor(station.status) }]}>
        {station.queueCount}
      </Text>
      <Text style={styles.stationLabel}>in queue</Text>
      {station.oldestItemMinutes > 0 && (
        <Text
          style={[
            styles.stationTimer,
            station.oldestItemMinutes > 5 && styles.stationTimerWarning,
          ]}
        >
          {station.oldestItemMinutes}m oldest
        </Text>
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
          <Text style={styles.headerTitle}>📋 EXPO COMMAND</Text>
          <Text style={styles.eventName}>Johnson Wedding Reception</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeLabel}>
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text style={styles.guestTotal}>120 Guests</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Left Panel - Table Groups */}
        <View style={styles.leftPanel}>
          <Text style={styles.panelTitle}>TABLE GROUPS</Text>
          <FlatList
            data={tableGroups}
            renderItem={renderTableGroup}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tableGroupList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isProcessing}
          />
        </View>

        {/* Right Panel - Station Overview */}
        <View style={styles.rightPanel}>
          <Text style={styles.panelTitle}>STATION STATUS</Text>
          <View style={styles.stationsGrid}>
            {stations.map(renderStationStatus)}
          </View>
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
            <Text style={styles.errorModalTitle}>⚠️ Course Completion Failed</Text>
            <Text style={styles.errorModalMessage}>{processingError}</Text>
            <Text style={styles.errorModalSubtext}>
              The course status has been reverted. Please check inventory and retry.
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
          console.log("Recovery complete, refreshing KDS data");
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
    borderBottomColor: KDS_COLORS.fire,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    marginBottom: 4,
  },
  eventName: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: KDS_COLORS.text,
  },
  guestTotal: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: KDS_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rightPanel: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  tableGroupList: {
    gap: 12,
  },
  tableGroupCard: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: KDS_COLORS.fire,
  },
  tableGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: KDS_COLORS.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: KDS_COLORS.border,
  },
  tableGroupName: {
    fontSize: 14,
    fontWeight: "bold",
    color: KDS_COLORS.text,
  },
  guestCount: {
    fontSize: 12,
    color: KDS_COLORS.textMuted,
  },
  coursesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: KDS_COLORS.border,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  courseProgress: {
    fontSize: 11,
    color: KDS_COLORS.textMuted,
  },
  courseStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    minWidth: 100,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  courseActions: {
    flexDirection: "row",
    gap: 8,
  },
  fireButton: {
    backgroundColor: KDS_COLORS.fire,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  fireButtonText: {
    color: KDS_COLORS.text,
    fontSize: 11,
    fontWeight: "bold",
  },
  serveButton: {
    backgroundColor: KDS_COLORS.ready,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  serveButtonProcessing: {
    opacity: 0.7,
  },
  serveButtonText: {
    color: KDS_COLORS.text,
    fontSize: 11,
    fontWeight: "bold",
  },
  progressIndicator: {
    backgroundColor: KDS_COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  progressText: {
    color: KDS_COLORS.text,
    fontSize: 10,
    fontWeight: "bold",
  },
  stationsGrid: {
    gap: 12,
  },
  stationCard: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: KDS_COLORS.border,
  },
  stationCardWarning: {
    borderColor: KDS_COLORS.urgent,
    backgroundColor: KDS_COLORS.surfaceLight,
  },
  stationName: {
    fontSize: 12,
    fontWeight: "bold",
    color: KDS_COLORS.text,
    marginBottom: 8,
  },
  stationQueue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stationLabel: {
    fontSize: 10,
    color: KDS_COLORS.textMuted,
    marginBottom: 8,
  },
  stationTimer: {
    fontSize: 11,
    color: KDS_COLORS.ready,
    fontWeight: "600",
  },
  stationTimerWarning: {
    color: KDS_COLORS.urgent,
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
