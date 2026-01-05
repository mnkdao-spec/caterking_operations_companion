import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
// Screen orientation will be handled natively

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type StationType = "expo" | "grill" | "saute" | "garde_manger" | "dessert" | "plating";

interface Station {
  id: StationType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const STATIONS: Station[] = [
  {
    id: "expo",
    name: "EXPO",
    icon: "📋",
    description: "Command Center",
    color: "#FF6B35",
  },
  {
    id: "grill",
    name: "GRILL",
    icon: "🔥",
    description: "Grilled Items",
    color: "#E74C3C",
  },
  {
    id: "saute",
    name: "SAUTÉ",
    icon: "🍳",
    description: "Pan & Sauté",
    color: "#F39C12",
  },
  {
    id: "garde_manger",
    name: "GARDE",
    icon: "🥗",
    description: "Cold Station",
    color: "#27AE60",
  },
  {
    id: "dessert",
    name: "DESSERT",
    icon: "🍰",
    description: "Pastry & Sweets",
    color: "#9B59B6",
  },
  {
    id: "plating",
    name: "PLATING",
    icon: "🍽️",
    description: "Final Assembly",
    color: "#3498DB",
  },
];

export default function StationSelector() {
  const [selectedStation, setSelectedStation] = useState<StationType | null>(null);

  const handleStationSelect = (station: Station) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setSelectedStation(station.id);

    // Navigate to appropriate screen
    setTimeout(() => {
      if (station.id === "expo") {
        router.push("/kds/expo" as any);
      } else if (station.id === "plating") {
        router.push("/kds/plating" as any);
      } else {
        router.push({
          pathname: "/kds/station" as any,
          params: { stationType: station.id, stationName: station.name },
        });
      }
    }, 150);
  };

  const handleBackToStaff = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToStaff} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Staff Mode</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CATERKING KDS</Text>
          <Text style={styles.headerSubtitle}>Select Your Station</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.eventLabel}>Active Event:</Text>
          <Text style={styles.eventName}>Johnson Wedding</Text>
        </View>
      </View>

      {/* Station Grid */}
      <View style={styles.stationGrid}>
        {STATIONS.map((station) => (
          <TouchableOpacity
            key={station.id}
            onPress={() => handleStationSelect(station)}
            activeOpacity={0.8}
            style={[
              styles.stationCard,
              selectedStation === station.id && styles.stationCardSelected,
              { borderColor: station.color },
            ]}
          >
            <Text style={styles.stationIcon}>{station.icon}</Text>
            <Text style={[styles.stationName, { color: station.color }]}>
              {station.name}
            </Text>
            <Text style={styles.stationDescription}>{station.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap a station to begin • All stations sync in real-time
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#2D2D2D",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: "#888",
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  eventLabel: {
    color: "#888",
    fontSize: 12,
  },
  eventName: {
    color: "#FF6B35",
    fontSize: 18,
    fontWeight: "700",
  },
  stationGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 24,
    gap: 20,
    justifyContent: "center",
    alignContent: "center",
  },
  stationCard: {
    width: SCREEN_WIDTH > 600 ? "30%" : "45%",
    aspectRatio: 1.2,
    backgroundColor: "#2D2D2D",
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  stationCardSelected: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  stationIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  stationName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  stationDescription: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
});
