import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Local storage service using AsyncStorage for data persistence
 */

const STORAGE_KEYS = {
  EVENTS: "@caterking/events",
  COURSES: "@caterking/courses",
  MENU_ITEMS: "@caterking/menu_items",
  TABLE_GROUPS: "@caterking/table_groups",
  FIRED_COURSES: "@caterking/fired_courses",
  ORDER_ITEMS: "@caterking/order_items",
  INGREDIENTS: "@caterking/ingredients",
  STOCK_LEVELS: "@caterking/stock_levels",
  ALERTS: "@caterking/alerts",
  TASKS: "@caterking/tasks",
  LAST_SYNC: "@caterking/last_sync",
} as const;

export const storage = {
  /**
   * Save data to AsyncStorage
   */
  async save<T>(key: keyof typeof STORAGE_KEYS, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(STORAGE_KEYS[key], jsonValue);
    } catch (error) {
      console.error(`[Storage] Error saving ${key}:`, error);
      throw error;
    }
  },

  /**
   * Load data from AsyncStorage
   */
  async load<T>(key: keyof typeof STORAGE_KEYS): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`[Storage] Error loading ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove data from AsyncStorage
   */
  async remove(key: keyof typeof STORAGE_KEYS): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Clear all app data from AsyncStorage
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error("[Storage] Error clearing all data:", error);
      throw error;
    }
  },

  /**
   * Check if data exists in AsyncStorage
   */
  async has(key: keyof typeof STORAGE_KEYS): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      return value !== null;
    } catch (error) {
      console.error(`[Storage] Error checking ${key}:`, error);
      return false;
    }
  },

  /**
   * Get all keys stored in AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error("[Storage] Error getting all keys:", error);
      return [];
    }
  },

  /**
   * Get storage size estimate (in bytes)
   */
  async getStorageSize(): Promise<number> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      const values = await AsyncStorage.multiGet(keys);
      let totalSize = 0;

      for (const [key, value] of values) {
        if (value) {
          totalSize += key.length + value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error("[Storage] Error calculating storage size:", error);
      return 0;
    }
  },

  /**
   * Update last sync timestamp
   */
  async updateLastSync(): Promise<void> {
    try {
      await this.save("LAST_SYNC", new Date().toISOString());
    } catch (error) {
      console.error("[Storage] Error updating last sync:", error);
    }
  },

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<Date | null> {
    try {
      const timestamp = await this.load<string>("LAST_SYNC");
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error("[Storage] Error getting last sync:", error);
      return null;
    }
  },
};

/**
 * Hook-friendly wrapper for storage operations with loading states
 */
export function useStorage() {
  const saveWithLoading = async <T,>(
    key: keyof typeof STORAGE_KEYS,
    data: T
  ): Promise<{ success: boolean; error?: Error }> => {
    try {
      await storage.save(key, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  const loadWithLoading = async <T,>(
    key: keyof typeof STORAGE_KEYS
  ): Promise<{ data: T | null; error?: Error }> => {
    try {
      const data = await storage.load<T>(key);
      return { data };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  return {
    save: saveWithLoading,
    load: loadWithLoading,
    remove: storage.remove,
    clearAll: storage.clearAll,
    has: storage.has,
    getStorageSize: storage.getStorageSize,
    updateLastSync: storage.updateLastSync,
    getLastSync: storage.getLastSync,
  };
}

/**
 * Storage migration utilities
 */
export const storageMigrations = {
  /**
   * Migrate data from old storage keys to new ones
   */
  async migrate(oldKey: string, newKey: keyof typeof STORAGE_KEYS): Promise<boolean> {
    try {
      const oldData = await AsyncStorage.getItem(oldKey);
      if (oldData) {
        await AsyncStorage.setItem(STORAGE_KEYS[newKey], oldData);
        await AsyncStorage.removeItem(oldKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[Storage] Error migrating ${oldKey} to ${newKey}:`, error);
      return false;
    }
  },

  /**
   * Check storage version and run migrations if needed
   */
  async checkAndMigrate(): Promise<void> {
    const STORAGE_VERSION_KEY = "@caterking/storage_version";
    const CURRENT_VERSION = "1.0.0";

    try {
      const storedVersion = await AsyncStorage.getItem(STORAGE_VERSION_KEY);

      if (!storedVersion) {
        // First time setup
        await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
        console.log("[Storage] Initialized storage version:", CURRENT_VERSION);
      } else if (storedVersion !== CURRENT_VERSION) {
        // Run migrations here if needed
        console.log("[Storage] Migrating from", storedVersion, "to", CURRENT_VERSION);
        await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      }
    } catch (error) {
      console.error("[Storage] Error checking storage version:", error);
    }
  },
};
