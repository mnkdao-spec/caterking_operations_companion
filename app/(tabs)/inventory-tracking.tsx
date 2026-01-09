import { useState, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

// Mock inventory data
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current: number;
  unit: string;
  reorderLevel: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  cost: number;
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    name: "Ribeye Steak",
    category: "Protein",
    current: 8,
    unit: "lb",
    reorderLevel: 5,
    status: "in_stock",
    cost: 15.99,
  },
  {
    id: "2",
    name: "Salmon Fillet",
    category: "Protein",
    current: 3,
    unit: "lb",
    reorderLevel: 4,
    status: "low_stock",
    cost: 12.50,
  },
  {
    id: "3",
    name: "Chicken Breast",
    category: "Protein",
    current: 0,
    unit: "lb",
    reorderLevel: 6,
    status: "out_of_stock",
    cost: 8.99,
  },
  {
    id: "4",
    name: "Olive Oil",
    category: "Pantry",
    current: 2.5,
    unit: "l",
    reorderLevel: 1,
    status: "in_stock",
    cost: 18.50,
  },
  {
    id: "5",
    name: "Fresh Basil",
    category: "Produce",
    current: 0.5,
    unit: "bunch",
    reorderLevel: 2,
    status: "low_stock",
    cost: 3.99,
  },
  {
    id: "6",
    name: "Mozzarella",
    category: "Dairy",
    current: 5,
    unit: "lb",
    reorderLevel: 3,
    status: "in_stock",
    cost: 9.99,
  },
];

export default function InventoryTrackingScreen() {
  const colors = useColors();
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "low_stock" | "out_of_stock">("all");

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return colors.success;
      case "low_stock":
        return colors.warning;
      case "out_of_stock":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_stock":
        return "In Stock";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const totalValue = inventory.reduce((sum, item) => sum + item.current * item.cost, 0);
  const lowStockCount = inventory.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = inventory.filter((i) => i.status === "out_of_stock").length;

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const statusColor = getStatusColor(item.status);
    const percentageOfReorder = (item.current / item.reorderLevel) * 100;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.inventoryCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.nameSection}>
            <Text style={[styles.itemName, { color: colors.foreground }]}>
              {item.name}
            </Text>
            <Text style={[styles.category, { color: colors.muted }]}>
              {item.category}
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

        {/* Quantity and Unit */}
        <View style={styles.quantitySection}>
          <Text style={[styles.quantityValue, { color: colors.foreground }]}>
            {item.current}
          </Text>
          <Text style={[styles.unit, { color: colors.muted }]}>
            {item.unit}
          </Text>
        </View>

        {/* Stock Level Bar */}
        <View style={[styles.stockBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.stockFill,
              {
                width: `${Math.min(percentageOfReorder, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>

        {/* Reorder Info */}
        <View style={styles.reorderInfo}>
          <Text style={[styles.reorderLabel, { color: colors.muted }]}>
            Reorder at: {item.reorderLevel} {item.unit}
          </Text>
          <Text style={[styles.costLabel, { color: colors.primary }]}>
            ${(item.current * item.cost).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Inventory Tracking
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          Real-time stock levels
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            ${totalValue.toFixed(0)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>
            Total Value
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.warning + "15" },
          ]}
        >
          <Text style={[styles.summaryNumber, { color: colors.warning }]}>
            {lowStockCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.warning }]}>
            Low Stock
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.error + "15" },
          ]}
        >
          <Text style={[styles.summaryNumber, { color: colors.error }]}>
            {outOfStockCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.error }]}>
            Out of Stock
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[
            styles.filterTab,
            filter === "all" && styles.filterTabActive,
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === "all" && styles.filterTabTextActive,
              { color: filter === "all" ? colors.background : colors.foreground },
            ]}
          >
            All ({inventory.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("low_stock")}
          style={[
            styles.filterTab,
            filter === "low_stock" && styles.filterTabActive,
            { borderColor: colors.warning },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === "low_stock" && styles.filterTabTextActive,
              {
                color:
                  filter === "low_stock" ? colors.background : colors.warning,
              },
            ]}
          >
            Low Stock ({lowStockCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("out_of_stock")}
          style={[
            styles.filterTab,
            filter === "out_of_stock" && styles.filterTabActive,
            { borderColor: colors.error },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === "out_of_stock" && styles.filterTabTextActive,
              {
                color:
                  filter === "out_of_stock" ? colors.background : colors.error,
              },
            ]}
          >
            Out ({outOfStockCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        renderItem={renderInventoryItem}
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
    fontSize: 20,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inventoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameSection: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  category: {
    fontSize: 12,
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
  quantitySection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
    gap: 6,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  unit: {
    fontSize: 14,
  },
  stockBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  stockFill: {
    height: "100%",
    borderRadius: 4,
  },
  reorderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reorderLabel: {
    fontSize: 12,
  },
  costLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
