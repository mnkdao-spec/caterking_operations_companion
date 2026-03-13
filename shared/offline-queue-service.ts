/**
 * Offline Queue Service
 * Manages persistence and retrieval of offline operations
 */

import * as OfflineQueueTypes from './offline-queue-types';

// ============================================================================
// STORAGE KEY CONSTANTS
// ============================================================================

const QUEUE_STORAGE_KEY = '@caterking/offline-queue';
const STATE_STORAGE_KEY = '@caterking/offline-queue-state';

// ============================================================================
// ASYNC STORAGE ADAPTER
// ============================================================================

/**
 * Adapter for AsyncStorage (React Native)
 * Falls back to localStorage for web and in-memory for tests
 */
class StorageAdapter {
  private storage: any;
  private memoryStore: Map<string, string> = new Map();

  constructor() {
    // Priority: localStorage > in-memory (for tests) > AsyncStorage
    
    // Try localStorage first (web)
    try {
      if (typeof localStorage !== 'undefined') {
        this.storage = {
          getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
          setItem: (key: string, value: string) => {
            localStorage.setItem(key, value);
            return Promise.resolve();
          },
          removeItem: (key: string) => {
            localStorage.removeItem(key);
            return Promise.resolve();
          },
        };
        return;
      }
    } catch (e) {
      // localStorage not available
    }

    // Check if we're in a test environment
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    
    // Try AsyncStorage only if not in test environment
    if (!isTestEnv) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (AsyncStorage) {
          this.storage = AsyncStorage;
          return;
        }
      } catch (e) {
        // AsyncStorage not available
      }
    }

    // Fall back to in-memory storage
    this.storage = {
      getItem: (key: string) => Promise.resolve(this.memoryStore.get(key) || null),
      setItem: (key: string, value: string) => {
        this.memoryStore.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        this.memoryStore.delete(key);
        return Promise.resolve();
      },
    };
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key);
  }
}

// ============================================================================
// OFFLINE QUEUE STORAGE IMPLEMENTATION
// ============================================================================

export class OfflineQueueStorageService implements OfflineQueueTypes.OfflineQueueStorage {
  private storage: StorageAdapter;
  private cache: Map<string, OfflineQueueTypes.QueuedOperation> = new Map();
  private state: OfflineQueueTypes.OfflineQueueState | null = null;

  constructor() {
    this.storage = new StorageAdapter();
  }

  // ============================================================================
  // READ OPERATIONS
  // ============================================================================

  async getQueue(): Promise<OfflineQueueTypes.OfflineQueueState> {
    if (this.state) {
      return this.state;
    }

    try {
      const stateJson = await this.storage.getItem(STATE_STORAGE_KEY);
      if (stateJson) {
        this.state = JSON.parse(stateJson);
        return this.state;
      }
    } catch (error) {
      console.error('[OfflineQueue] Error loading state:', error);
    }

    // Return default state
    this.state = this.getDefaultState();
    return this.state;
  }

  async getOperation(id: string): Promise<OfflineQueueTypes.QueuedOperation | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id) || null;
    }

    try {
      const queueJson = await this.storage.getItem(QUEUE_STORAGE_KEY);
      if (!queueJson) return null;

      const operations: OfflineQueueTypes.QueuedOperation[] = JSON.parse(queueJson);
      const operation = operations.find((op) => op.id === id);

      if (operation) {
        this.cache.set(id, operation);
      }

      return operation || null;
    } catch (error) {
      console.error('[OfflineQueue] Error loading operation:', error);
      return null;
    }
  }

  async getOperations(
    filter?: Partial<OfflineQueueTypes.QueuedOperation>
  ): Promise<OfflineQueueTypes.QueuedOperation[]> {
    try {
      const queueJson = await this.storage.getItem(QUEUE_STORAGE_KEY);
      if (!queueJson) return [];

      let operations: OfflineQueueTypes.QueuedOperation[] = JSON.parse(queueJson);

      // Apply filter if provided
      if (filter) {
        operations = operations.filter((op) => {
          return Object.entries(filter).every(([key, value]) => {
            return (op as any)[key] === value;
          });
        });
      }

      return operations;
    } catch (error) {
      console.error('[OfflineQueue] Error loading operations:', error);
      return [];
    }
  }

  // ============================================================================
  // WRITE OPERATIONS
  // ============================================================================

  async addOperation(operation: OfflineQueueTypes.QueuedOperation): Promise<void> {
    const operations = await this.getOperations();
    operations.push(operation);

    this.cache.set(operation.id, operation);
    await this.saveOperations(operations);
    await this.updateState({
      totalOperations: operations.length,
      pendingOperations: operations.filter((op) => op.status === 'pending').length,
    });
  }

  async updateOperation(
    id: string,
    updates: Partial<OfflineQueueTypes.QueuedOperation>
  ): Promise<void> {
    const operations = await this.getOperations();
    const index = operations.findIndex((op) => op.id === id);

    if (index === -1) {
      throw new Error(`Operation ${id} not found`);
    }

    operations[index] = { ...operations[index], ...updates };
    this.cache.set(id, operations[index]);

    await this.saveOperations(operations);
    await this.updateState({
      pendingOperations: operations.filter((op) => op.status === 'pending').length,
      failedOperations: operations.filter((op) => op.status === 'failed').length,
      syncedOperations: operations.filter((op) => op.status === 'synced').length,
    });
  }

  async removeOperation(id: string): Promise<void> {
    const operations = await this.getOperations();
    const filtered = operations.filter((op) => op.id !== id);

    this.cache.delete(id);
    await this.saveOperations(filtered);
    await this.updateState({
      totalOperations: filtered.length,
      pendingOperations: filtered.filter((op) => op.status === 'pending').length,
    });
  }

  async clearQueue(): Promise<void> {
    this.cache.clear();
    await this.storage.removeItem(QUEUE_STORAGE_KEY);
    this.state = this.getDefaultState();
    await this.saveState(this.state);
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async addOperations(operations: OfflineQueueTypes.QueuedOperation[]): Promise<void> {
    const existing = await this.getOperations();
    const combined = [...existing, ...operations];

    operations.forEach((op) => this.cache.set(op.id, op));
    await this.saveOperations(combined);
    await this.updateState({
      totalOperations: combined.length,
      pendingOperations: combined.filter((op) => op.status === 'pending').length,
    });
  }

  async updateOperations(
    updates: Array<{ id: string; data: Partial<OfflineQueueTypes.QueuedOperation> }>
  ): Promise<void> {
    const operations = await this.getOperations();

    updates.forEach(({ id, data }) => {
      const index = operations.findIndex((op) => op.id === id);
      if (index !== -1) {
        operations[index] = { ...operations[index], ...data };
        this.cache.set(id, operations[index]);
      }
    });

    await this.saveOperations(operations);
    await this.updateState({
      pendingOperations: operations.filter((op) => op.status === 'pending').length,
      failedOperations: operations.filter((op) => op.status === 'failed').length,
      syncedOperations: operations.filter((op) => op.status === 'synced').length,
    });
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  async setState(state: Partial<OfflineQueueTypes.OfflineQueueState>): Promise<void> {
    const current = await this.getQueue();
    this.state = { ...current, ...state, updatedAt: Date.now() };
    await this.saveState(this.state);
  }

  async getState(): Promise<OfflineQueueTypes.OfflineQueueState> {
    return this.getQueue();
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async saveOperations(operations: OfflineQueueTypes.QueuedOperation[]): Promise<void> {
    try {
      const json = JSON.stringify(operations);
      await this.storage.setItem(QUEUE_STORAGE_KEY, json);
    } catch (error) {
      console.error('[OfflineQueue] Error saving operations:', error);
      throw error;
    }
  }

  private async saveState(state: OfflineQueueTypes.OfflineQueueState): Promise<void> {
    try {
      const json = JSON.stringify(state);
      await this.storage.setItem(STATE_STORAGE_KEY, json);
    } catch (error) {
      console.error('[OfflineQueue] Error saving state:', error);
      throw error;
    }
  }

  private getDefaultState(): OfflineQueueTypes.OfflineQueueState {
    return {
      operations: [],
      isOnline: true,
      totalOperations: 0,
      pendingOperations: 0,
      failedOperations: 0,
      syncedOperations: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private async updateState(updates: Partial<OfflineQueueTypes.OfflineQueueState>): Promise<void> {
    const current = await this.getQueue();
    this.state = { ...current, ...updates, updatedAt: Date.now() };
    await this.saveState(this.state);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let storageInstance: OfflineQueueStorageService | null = null;

export function getOfflineQueueStorage(): OfflineQueueTypes.OfflineQueueStorage {
  if (!storageInstance) {
    storageInstance = new OfflineQueueStorageService();
  }
  return storageInstance;
}

export function resetOfflineQueueStorage(): void {
  storageInstance = null;
}
