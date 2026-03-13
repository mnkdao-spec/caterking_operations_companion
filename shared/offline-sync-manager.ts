/**
 * Offline Sync Manager
 * Handles connection detection, retry logic, and operation syncing
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CateringDatabase } from './supabase-service';
import * as OfflineQueueTypes from './offline-queue-types';
import { getOfflineQueueStorage } from './offline-queue-service';

// ============================================================================
// SYNC MANAGER IMPLEMENTATION
// ============================================================================

export class OfflineSyncManager implements OfflineQueueTypes.SyncManager {
  private storage: OfflineQueueTypes.OfflineQueueStorage;
  private db: CateringDatabase;
  private supabase: SupabaseClient;
  private isOnline: boolean = true;
  private listeners: Map<OfflineQueueTypes.OfflineQueueEventType, Set<OfflineQueueTypes.OfflineQueueListener>> = new Map();
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // Default options
  private defaultOptions: Required<OfflineQueueTypes.SyncOptions> = {
    batchSize: 10,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    conflictStrategy: 'overwrite',
    preserveLocalChanges: true,
    entityTypes: ['client', 'staff', 'event', 'invoice', 'inventory', 'assignment'],
    statuses: ['pending', 'failed'],
    minPriority: 0,
  };

  constructor(supabase: SupabaseClient, db: CateringDatabase) {
    this.supabase = supabase;
    this.db = db;
    this.storage = getOfflineQueueStorage();
    this.setupConnectionListener();
    this.startAutoSync();
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  async sync(options?: OfflineQueueTypes.SyncOptions): Promise<OfflineQueueTypes.SyncResult[]> {
    if (this.syncInProgress) {
      console.log('[SyncManager] Sync already in progress, skipping');
      return [];
    }

    this.syncInProgress = true;
    this.emit('sync_started', {});

    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const operations = await this.storage.getOperations({
        status: 'pending' as any,
      });

      if (operations.length === 0) {
        console.log('[SyncManager] No operations to sync');
        this.emit('sync_completed', { results: [] });
        return [];
      }

      console.log(`[SyncManager] Starting sync of ${operations.length} operations`);

      // Sort by priority (high first) and timestamp
      const sorted = operations.sort((a, b) => {
        const priorityDiff = (b.priority || 0) - (a.priority || 0);
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      // Sync in batches
      const results: OfflineQueueTypes.SyncResult[] = [];
      for (let i = 0; i < sorted.length; i += mergedOptions.batchSize) {
        const batch = sorted.slice(i, i + mergedOptions.batchSize);
        const batchResults = await Promise.all(
          batch.map((op) => this.syncOperation(op.id, mergedOptions))
        );
        results.push(...batchResults);
      }

      this.emit('sync_completed', { results });
      return results;
    } catch (error) {
      console.error('[SyncManager] Sync error:', error);
      this.emit('sync_failed', { error });
      return [];
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncOperation(
    operationId: string,
    options?: OfflineQueueTypes.SyncOptions
  ): Promise<OfflineQueueTypes.SyncResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const operation = await this.storage.getOperation(operationId);

    if (!operation) {
      return {
        success: false,
        operationId,
        entityId: '',
        error: {
          code: 'NOT_FOUND',
          message: 'Operation not found',
        },
      };
    }

    try {
      // Mark as syncing
      await this.storage.updateOperation(operationId, { status: 'syncing' });

      const result = await this.executeOperation(operation, mergedOptions);

      if (result.success) {
        // Mark as synced
        await this.storage.updateOperation(operationId, {
          status: 'synced',
          lastError: undefined,
        });

        this.emit('operation_synced', { operationId, result });
      } else {
        // Handle failure
        operation.retryCount++;

        if (operation.retryCount < mergedOptions.maxRetries) {
          // Retry later
          await this.storage.updateOperation(operationId, {
            status: 'pending',
            retryCount: operation.retryCount,
            lastError: result.error?.message,
          });
        } else {
          // Max retries exceeded
          await this.storage.updateOperation(operationId, {
            status: 'failed',
            retryCount: operation.retryCount,
            lastError: result.error?.message,
          });

          this.emit('operation_failed', { operationId, error: result.error });
        }
      }

      return result;
    } catch (error) {
      console.error('[SyncManager] Error syncing operation:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.storage.updateOperation(operationId, {
        status: 'failed',
        retryCount: operation.retryCount + 1,
        lastError: errorMessage,
      });

      return {
        success: false,
        operationId,
        entityId: operation.entityId,
        error: {
          code: 'SYNC_ERROR',
          message: errorMessage,
        },
      };
    }
  }

  async syncBatch(operationIds: string[]): Promise<OfflineQueueTypes.SyncResult[]> {
    return Promise.all(operationIds.map((id) => this.syncOperation(id)));
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  async addToQueue(operation: OfflineQueueTypes.QueuedOperation): Promise<void> {
    await this.storage.addOperation(operation);
    this.emit('operation_added', { operation });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.sync().catch((error) => console.error('[SyncManager] Auto-sync error:', error));
    }
  }

  async removeFromQueue(operationId: string): Promise<void> {
    await this.storage.removeOperation(operationId);
  }

  async clearQueue(): Promise<void> {
    await this.storage.clearQueue();
    this.emit('queue_cleared', {});
  }

  // ============================================================================
  // STATUS
  // ============================================================================

  getStatus(): OfflineQueueTypes.OfflineQueueState {
    // This is synchronous, so we return cached state
    // For actual state, use getStatusAsync()
    return {
      operations: [],
      isOnline: this.isOnline,
      totalOperations: 0,
      pendingOperations: 0,
      failedOperations: 0,
      syncedOperations: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async getStatusAsync(): Promise<OfflineQueueTypes.OfflineQueueState> {
    const state = await this.storage.getState();
    return { ...state, isOnline: this.isOnline };
  }

  getPendingOperations(): OfflineQueueTypes.QueuedOperation[] {
    // This requires async access, so return empty for now
    // Use getPendingOperationsAsync() instead
    return [];
  }

  async getPendingOperationsAsync(): Promise<OfflineQueueTypes.QueuedOperation[]> {
    return this.storage.getOperations({ status: 'pending' as any });
  }

  getFailedOperations(): OfflineQueueTypes.QueuedOperation[] {
    // This requires async access, so return empty for now
    // Use getFailedOperationsAsync() instead
    return [];
  }

  async getFailedOperationsAsync(): Promise<OfflineQueueTypes.QueuedOperation[]> {
    return this.storage.getOperations({ status: 'failed' as any });
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  on(event: OfflineQueueTypes.OfflineQueueEventType, listener: OfflineQueueTypes.OfflineQueueListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: OfflineQueueTypes.OfflineQueueEventType, listener: OfflineQueueTypes.OfflineQueueListener): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
    }
  }

  private emit(event: OfflineQueueTypes.OfflineQueueEventType, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener({
            type: event,
            timestamp: Date.now(),
            data,
          });
        } catch (error) {
          console.error(`[SyncManager] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // CONNECTION
  // ============================================================================

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  setOnline(online: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = online;

    if (!wasOnline && online) {
      console.log('[SyncManager] Connection restored, starting sync');
      this.emit('connection_changed', { isOnline: true });
      this.sync().catch((error) => console.error('[SyncManager] Auto-sync error:', error));
    } else if (wasOnline && !online) {
      console.log('[SyncManager] Connection lost');
      this.emit('connection_changed', { isOnline: false });
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async executeOperation(
    operation: OfflineQueueTypes.QueuedOperation,
    options: Required<OfflineQueueTypes.SyncOptions>
  ): Promise<OfflineQueueTypes.SyncResult> {
    try {
      switch (operation.type) {
        case 'create':
          return await this.executeCreate(operation, options);
        case 'update':
          return await this.executeUpdate(operation, options);
        case 'delete':
          return await this.executeDelete(operation, options);
        case 'custom':
          return await this.executeCustom(operation, options);
        default:
          return {
            success: false,
            operationId: operation.id,
            entityId: operation.entityId,
            error: {
              code: 'UNKNOWN_OPERATION',
              message: `Unknown operation type: ${operation.type}`,
            },
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async executeCreate(
    operation: OfflineQueueTypes.QueuedOperation,
    options: Required<OfflineQueueTypes.SyncOptions>
  ): Promise<OfflineQueueTypes.SyncResult> {
    try {
      const { entityType, payload } = operation;

      let result: any;
      switch (entityType) {
        case 'client':
          result = await this.db.createClient(payload);
          break;
        case 'staff':
          result = await this.db.createStaff(payload);
          break;
        case 'event':
          result = await this.db.createEvent(payload);
          break;
        case 'invoice':
          result = await this.db.createInvoice(payload);
          break;
        case 'inventory':
          result = await this.db.createInventoryItem(payload);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      return {
        success: true,
        operationId: operation.id,
        entityId: result.id,
        serverData: result,
      };
    } catch (error) {
      throw error;
    }
  }

  private async executeUpdate(
    operation: OfflineQueueTypes.QueuedOperation,
    options: Required<OfflineQueueTypes.SyncOptions>
  ): Promise<OfflineQueueTypes.SyncResult> {
    try {
      const { entityType, entityId, payload } = operation;

      let result: any;
      switch (entityType) {
        case 'client':
          result = await this.db.updateClient(entityId, payload);
          break;
        case 'staff':
          result = await this.db.updateStaff(entityId, payload);
          break;
        case 'event':
          result = await this.db.updateEvent(entityId, payload);
          break;
        case 'invoice':
          result = await this.db.updateInvoice(entityId, payload);
          break;
        case 'inventory':
          result = await this.db.updateInventoryItem(entityId, payload);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      return {
        success: true,
        operationId: operation.id,
        entityId,
        serverData: result,
      };
    } catch (error) {
      throw error;
    }
  }

  private async executeDelete(
    operation: OfflineQueueTypes.QueuedOperation,
    options: Required<OfflineQueueTypes.SyncOptions>
  ): Promise<OfflineQueueTypes.SyncResult> {
    try {
      const { entityType, entityId } = operation;

      switch (entityType) {
        case 'client':
          await this.db.deleteClient(entityId);
          break;
        case 'staff':
          await this.db.deleteStaff(entityId);
          break;
        case 'event':
          await this.db.deleteEvent(entityId);
          break;
        case 'invoice':
          await this.supabase.from('invoices').delete().eq('id', entityId);
          break;
        case 'inventory':
          await this.db.deleteInventoryItem(entityId);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      return {
        success: true,
        operationId: operation.id,
        entityId,
      };
    } catch (error) {
      throw error;
    }
  }

  private async executeCustom(
    operation: OfflineQueueTypes.QueuedOperation,
    options: Required<OfflineQueueTypes.SyncOptions>
  ): Promise<OfflineQueueTypes.SyncResult> {
    // Custom operations can be handled by the application
    console.log('[SyncManager] Custom operation:', operation);
    return {
      success: true,
      operationId: operation.id,
      entityId: operation.entityId,
    };
  }

  private setupConnectionListener(): void {
    // For React Native, use NetInfo
    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      NetInfo.addEventListener((state: any) => {
        this.setOnline(state.isConnected);
      });
    } catch {
      // Fall back to browser API
      try {
        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('online', () => this.setOnline(true));
          window.addEventListener('offline', () => this.setOnline(false));
        }
      } catch (error) {
        console.log('[SyncManager] Connection listener not available in test environment');
      }
    }
  }

  private startAutoSync(): void {
    // Auto-sync every 30 seconds if online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.sync().catch((error) => console.error('[SyncManager] Auto-sync error:', error));
      }
    }, 30000);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let syncManagerInstance: OfflineSyncManager | null = null;

export function getOfflineSyncManager(
  supabase: SupabaseClient,
  db: CateringDatabase
): OfflineSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new OfflineSyncManager(supabase, db);
  }
  return syncManagerInstance;
}

export function resetOfflineSyncManager(): void {
  if (syncManagerInstance) {
    syncManagerInstance.destroy();
  }
  syncManagerInstance = null;
}
