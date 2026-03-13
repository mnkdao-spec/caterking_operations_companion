import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { storage } from "@/lib/storage";
import { LoadingSpinner, SkeletonList } from "@/components/ui/loading-spinner";

type StockStatus = "ok" | "low" | "critical";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  status: StockStatus;
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    name: "Atlantic Salmon",
    category: "Proteins",
    quantity: 2,
    unit: "portions",
    minStock: 10,
    status: "critical",
  },
  {
    id: "2",
    name: "Beef Tenderloin",
    category: "Proteins",
    quantity: 15,
    unit: "lbs",
    minStock: 20,
    status: "low",
  },
  {
    id: "3",
    name: "Chicken Breast",
    category: "Proteins",
    quantity: 45,
    unit: "lbs",
    minStock: 30,
    status: "ok",
  },
  {
    id: "4",
    name: "Mixed Greens",
    category: "Produce",
    quantity: 8,
    unit: "lbs",
    minStock: 15,
    status: "low",
  },
  {
    id: "5",
    name: "Cherry Tomatoes",
    category: "Produce",
    quantity: 25,
    unit: "lbs",
    minStock: 10,
    status: "ok",
  },
  {
    id: "6",
    name: "Parmesan Cheese",
    category: "Dairy",
    quantity: 12,
    unit: "lbs",
    minStock: 8,
    status: "ok",
  },
  {
    id: "7",
    name: "Heavy Cream",
    category: "Dairy",
    quantity: 4,
    unit: "quarts",
    minStock: 10,
    status: "critical",
  },
  {
    id: "8",
    name: "Olive Oil",
    category: "Pantry",
    quantity: 6,
    unit: "liters",
    minStock: 5,
    status: "ok",
  },
  {
    id: "9",
    name: "Truffle Oil",
    category: "Pantry",
    quantity: 3,
    unit: "bottles",
    minStock: 4,
    status: "low",
  },
  {
    id: "10",
    name: "Arborio Rice",
    category: "Pantry",
    quantity: 20,
    unit: "lbs",
    minStock: 15,
    status: "ok",
  },
];

type FilterCategory = "all" | "critical" | "low" | "ok";

export default function InventoryScreen() {
  const colors = useColors();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Load inventory from storage on mount
  useEffect(() => {
    loadInventory();
  }, []);

  // Save inventory to storage whenever it changes
  useEffect(() => {
    if (!loading && inventory.length > 0) {
      storage.save("STOCK_LEVELS", inventory);
    }
  }, [inventory, loading]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const storedInventory = await storage.load<InventoryItem[]>("STOCK_LEVELS");
      if (storedInventory && storedInventory.length > 0) {
        setInventory(storedInventory);
      } else {
        setInventory(MOCK_INVENTORY);
        await storage.save("STOCK_LEVELS", MOCK_INVENTORY);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      setInventory(MOCK_INVENTORY);
    } finally {
      setLoading(false);
    }
  };
  const [filter, setFilter] = useState<FilterCategory>("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInventory();
      await storage.updateLastSync();
    } catch (error) {
      console.error("Error refreshing inventory:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getStatusColor = (status: StockStatus) => {
    switch (status) {
      case "critical":
        return colors.error;
      case "low":
        return colors.warning;
      case "ok":
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: StockStatus) => {
    switch (status) {
      case "critical":
        return "Critical";
      case "low":
        return "Low";
      case "ok":
        return "In Stock";
      default:
        return status;
    }
  };

  const filteredInventory = useMemo(() => {
    let items = inventory;

    // Apply search filter
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filter !== "all") {
      items = items.filter((item) => item.status === filter);
    }

    return items;
  }, [inventory, searchQuery, filter]);

  const handleQRScan = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Placeholder for QR scanning functionality
    alert("QR Scanner will be available in the next update!");
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          let newStatus: StockStatus = "ok";
          if (newQuantity === 0) {
            newStatus = "critical";
          } else if (newQuantity < item.minStock * 0.5) {
            newStatus = "critical";
          } else if (newQuantity < item.minStock) {
            newStatus = "low";
          }
          return { ...item, quantity: newQuantity, status: newStatus };
        }
        return item;
      })
    );
  };

  const renderFilterButton = (filterType: FilterCategory, label: string, count: number) => {
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
        <View
          style={[
            styles.filterCount,
            {
              backgroundColor: isActive ? "rgba(255,255,255,0.3)" : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.filterCountText,
              { color: isActive ? "#FFFFFF" : colors.muted },
            ]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View
        style={[
          styles.itemCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Status indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

        <View style={styles.itemContent}>
          {/* Header */}
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemCategory, { color: colors.muted }]}>
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

          {/* Quantity row */}
          <View style={styles.quantityRow}>
            <View style={styles.quantityInfo}>
              <Text style={[styles.quantityValue, { color: colors.foreground }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.quantityUnit, { color: colors.muted }]}>
                {item.unit}
              </Text>
              <Text style={[styles.minStock, { color: colors.muted }]}>
                (min: {item.minStock})
              </Text>
            </View>

            {/* Quick update buttons */}
            <View style={styles.quantityButtons}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.id, -1)}
                style={[
                  styles.quantityButton,
                  { backgroundColor: colors.error + "20", borderColor: colors.error },
                ]}
              >
                <Text style={[styles.quantityButtonText, { color: colors.error }]}>
                  -
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.id, 1)}
                style={[
                  styles.quantityButton,
                  { backgroundColor: colors.success + "20", borderColor: colors.success },
                ]}
              >
                <Text style={[styles.quantityButtonText, { color: colors.success }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const criticalCount = inventory.filter((i) => i.status === "critical").length;
  const lowCount = inventory.filter((i) => i.status === "low").length;
  const okCount = inventory.filter((i) => i.status === "ok").length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Inventory
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              Quick stock check and updates
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleQRScan}
            style={[styles.qrButton, { backgroundColor: colors.primary }]}
          >
            <IconSymbol name="qrcode" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search inventory..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {renderFilterButton("all", "All", inventory.length)}
        {renderFilterButton("critical", "Critical", criticalCount)}
        {renderFilterButton("low", "Low", lowCount)}
        {renderFilterButton("ok", "In Stock", okCount)}
      </View>

      {/* Inventory list */}
      {loading ? (
        <SkeletonList count={5} className="p-4" />
      ) : (
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="cube.box.fill" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No items found
              </Text>
            </View>
          }
        />
      )}
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
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  statusIndicator: {
    width: 4,
  },
  itemContent: {
    flex: 1,
    padding: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemCategory: {
    fontSize: 13,
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
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  quantityInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  quantityUnit: {
    fontSize: 14,
  },
  minStock: {
    fontSize: 12,
  },
  quantityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "600",
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
