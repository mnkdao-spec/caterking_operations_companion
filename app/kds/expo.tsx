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
};

interface TableGroup {
  id: string;
  name: string;
  guestCount: number;
  courses: CourseStatus[];
}

interface CourseStatus {
  courseNumber: number;
  name: string;
  status: "pending" | "fired" | "in_progress" | "ready" | "served";
  itemCount: number;
  readyCount: number;
  firedAt?: Date;
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
    courses: [
      { courseNumber: 1, name: "Appetizers", status: "served", itemCount: 4, readyCount: 4 },
      { courseNumber: 2, name: "Salads", status: "ready", itemCount: 3, readyCount: 3 },
      { courseNumber: 3, name: "Main Course", status: "in_progress", itemCount: 5, readyCount: 2 },
      { courseNumber: 4, name: "Dessert", status: "pending", itemCount: 2, readyCount: 0 },
    ],
  },
  {
    id: "2",
    name: "Tables 5-8",
    guestCount: 28,
    courses: [
      { courseNumber: 1, name: "Appetizers", status: "served", itemCount: 4, readyCount: 4 },
      { courseNumber: 2, name: "Salads", status: "fired", itemCount: 3, readyCount: 0 },
      { courseNumber: 3, name: "Main Course", status: "pending", itemCount: 5, readyCount: 0 },
      { courseNumber: 4, name: "Dessert", status: "pending", itemCount: 2, readyCount: 0 },
    ],
  },
  {
    id: "3",
    name: "Tables 9-12",
    guestCount: 36,
    courses: [
      { courseNumber: 1, name: "Appetizers", status: "in_progress", itemCount: 4, readyCount: 2 },
      { courseNumber: 2, name: "Salads", status: "pending", itemCount: 3, readyCount: 0 },
      { courseNumber: 3, name: "Main Course", status: "pending", itemCount: 5, readyCount: 0 },
      { courseNumber: 4, name: "Dessert", status: "pending", itemCount: 2, readyCount: 0 },
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
  const [tableGroups, setTableGroups] = useState<TableGroup[]>(MOCK_TABLE_GROUPS);
  const [stations, setStations] = useState<StationStatus[]>(MOCK_STATIONS);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const handleMarkServed = (tableGroupId: string, courseNumber: number) => {
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
                ? { ...course, status: "served" as const }
                : course
            ),
          };
        }
        return group;
      })
    );
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
            >
              <Text style={styles.fireButtonText}>🔥 FIRE</Text>
            </TouchableOpacity>
          )}
          {canServe && (
            <TouchableOpacity
              onPress={() => handleMarkServed(tableGroupId, course.courseNumber)}
              style={styles.serveButton}
            >
              <Text style={styles.serveButtonText}>✓ SERVED</Text>
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
          />
        </View>

        {/* Right Panel - Station Overview */}
        <View style={styles.rightPanel}>
          <Text style={styles.panelTitle}>STATION STATUS</Text>
          <View style={styles.stationsGrid}>
            {stations.map(renderStationStatus)}
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Courses Served</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: KDS_COLORS.warning }]}>2</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: KDS_COLORS.ready }]}>1</Text>
              <Text style={styles.statLabel}>Ready to Serve</Text>
            </View>
          </View>
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
    borderBottomWidth: 2,
    borderBottomColor: KDS_COLORS.border,
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
  headerTitle: {
    color: KDS_COLORS.fire,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  eventName: {
    color: KDS_COLORS.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timeLabel: {
    color: KDS_COLORS.text,
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  guestTotal: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 2,
    borderRightWidth: 2,
    borderRightColor: KDS_COLORS.border,
    padding: 16,
  },
  rightPanel: {
    flex: 1,
    padding: 16,
  },
  panelTitle: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
  },
  tableGroupList: {
    gap: 16,
  },
  tableGroupCard: {
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  tableGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: KDS_COLORS.surfaceLight,
  },
  tableGroupName: {
    color: KDS_COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  guestCount: {
    color: KDS_COLORS.textMuted,
    fontSize: 14,
  },
  coursesContainer: {
    padding: 12,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KDS_COLORS.border,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  courseProgress: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  courseStatus: {
    flexDirection: "row",
    alignItems: "center",
    width: 120,
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  courseActions: {
    width: 140,
    alignItems: "flex-end",
  },
  fireButton: {
    backgroundColor: KDS_COLORS.fire,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  fireButtonText: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  serveButton: {
    backgroundColor: KDS_COLORS.ready,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  serveButtonText: {
    color: KDS_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  progressIndicator: {
    backgroundColor: KDS_COLORS.warning + "30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  progressText: {
    color: KDS_COLORS.warning,
    fontSize: 12,
    fontWeight: "700",
  },
  stationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stationCard: {
    width: "47%",
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  stationCardWarning: {
    borderWidth: 2,
    borderColor: KDS_COLORS.warning,
  },
  stationName: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  stationQueue: {
    fontSize: 48,
    fontWeight: "800",
    marginVertical: 4,
  },
  stationLabel: {
    color: KDS_COLORS.textMuted,
    fontSize: 12,
  },
  stationTimer: {
    color: KDS_COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  stationTimerWarning: {
    color: KDS_COLORS.warning,
    fontWeight: "700",
  },
  quickStats: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: KDS_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    color: KDS_COLORS.text,
    fontSize: 32,
    fontWeight: "800",
  },
  statLabel: {
    color: KDS_COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
});
