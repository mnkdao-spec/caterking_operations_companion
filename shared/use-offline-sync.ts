/**
 * Offline Sync React Hooks
 * Provides hooks for offline-aware operations and sync status
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { CateringDatabase } from './supabase-service';
import { OfflineSyncManager, getOfflineSyncManager } from './offline-sync-manager';
import { getOfflineQueueStorage } from './offline-queue-service';
import * as OfflineQueueTypes from './offline-queue-types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// OFFLINE SYNC CONTEXT HOOK
// ============================================================================

/**
 * Hook to access the offline sync manager
 */
export function useOfflineSyncManager(
  supabase: SupabaseClient,
  db: CateringDatabase
): OfflineSyncManager {
  const managerRef = useRef<OfflineSyncManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = getOfflineSyncManager(supabase, db);
  }

  return managerRef.current;
}

// ============================================================================
// SYNC STATUS HOOK
// ============================================================================

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  failedOperations: number;
  syncedOperations: number;
  totalOperations: number;
  lastSyncTime?: number;
}

/**
 * Hook to monitor sync status
 */
export function useSyncStatus(syncManager: OfflineSyncManager): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: syncManager.isOnlineStatus(),
    isSyncing: false,
    pendingOperations: 0,
    failedOperations: 0,
    syncedOperations: 0,
    totalOperations: 0,
  });

  useEffect(() => {
    const updateStatus = async () => {
      const state = await syncManager.getStatusAsync();
      setStatus({
        isOnline: state.isOnline,
        isSyncing: false,
        pendingOperations: state.pendingOperations,
        failedOperations: state.failedOperations,
        syncedOperations: state.syncedOperations,
        totalOperations: state.totalOperations,
        lastSyncTime: state.lastOnlineTime,
      });
    };

    updateStatus();

    // Listen for sync events
    const handleSyncStarted = () => {
      setStatus((prev) => ({ ...prev, isSyncing: true }));
    };

    const handleSyncCompleted = () => {
      setStatus((prev) => ({ ...prev, isSyncing: false }));
      updateStatus();
    };

    const handleConnectionChanged = (event: OfflineQueueTypes.OfflineQueueEvent) => {
      setStatus((prev) => ({
        ...prev,
        isOnline: event.data?.isOnline ?? prev.isOnline,
      }));
    };

    syncManager.on('sync_started', handleSyncStarted);
    syncManager.on('sync_completed', handleSyncCompleted);
    syncManager.on('connection_changed', handleConnectionChanged);

    // Poll for status updates
    const interval = setInterval(updateStatus, 5000);

    return () => {
      syncManager.off('sync_started', handleSyncStarted);
      syncManager.off('sync_completed', handleSyncCompleted);
      syncManager.off('connection_changed', handleConnectionChanged);
      clearInterval(interval);
    };
  }, [syncManager]);

  return status;
}

// ============================================================================
// OFFLINE CREATE HOOK
// ============================================================================

export interface UseOfflineCreateOptions {
  entityType: OfflineQueueTypes.EntityType;
  priority?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for creating entities with offline support
 */
export function useOfflineCreate(
  syncManager: OfflineSyncManager,
  options: UseOfflineCreateOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (data: Record<string, any>) => {
      try {
        setIsLoading(true);
        setError(null);

        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: options.entityType,
          entityId: uuidv4(), // Temporary ID for new entities
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: options.priority || 1,
        };

        await syncManager.addToQueue(operation);

        // Return temporary ID so UI can reference the entity
        const result = { id: operation.entityId, ...data };
        options.onSuccess?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create entity');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncManager, options]
  );

  return { create, isLoading, error };
}

// ============================================================================
// OFFLINE UPDATE HOOK
// ============================================================================

export interface UseOfflineUpdateOptions {
  entityType: OfflineQueueTypes.EntityType;
  priority?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for updating entities with offline support
 */
export function useOfflineUpdate(
  syncManager: OfflineSyncManager,
  options: UseOfflineUpdateOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (entityId: string, data: Record<string, any>) => {
      try {
        setIsLoading(true);
        setError(null);

        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'update',
          entityType: options.entityType,
          entityId,
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: options.priority || 1,
        };

        await syncManager.addToQueue(operation);

        const result = { id: entityId, ...data };
        options.onSuccess?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update entity');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncManager, options]
  );

  return { update, isLoading, error };
}

// ============================================================================
// OFFLINE DELETE HOOK
// ============================================================================

export interface UseOfflineDeleteOptions {
  entityType: OfflineQueueTypes.EntityType;
  priority?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for deleting entities with offline support
 */
export function useOfflineDelete(
  syncManager: OfflineSyncManager,
  options: UseOfflineDeleteOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const delete_ = useCallback(
    async (entityId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'delete',
          entityType: options.entityType,
          entityId,
          payload: {},
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: options.priority || 1,
        };

        await syncManager.addToQueue(operation);

        options.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete entity');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [syncManager, options]
  );

  return { delete: delete_, isLoading, error };
}

// ============================================================================
// PENDING OPERATIONS HOOK
// ============================================================================

/**
 * Hook to monitor pending operations
 */
export function usePendingOperations(syncManager: OfflineSyncManager) {
  const [operations, setOperations] = useState<OfflineQueueTypes.QueuedOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setIsLoading(true);
        const pending = await syncManager.getPendingOperationsAsync();
        setOperations(pending);
      } catch (error) {
        console.error('[usePendingOperations] Error loading operations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOperations();

    // Listen for operation changes
    const handleOperationAdded = () => loadOperations();
    const handleOperationSynced = () => loadOperations();
    const handleOperationFailed = () => loadOperations();

    syncManager.on('operation_added', handleOperationAdded);
    syncManager.on('operation_synced', handleOperationSynced);
    syncManager.on('operation_failed', handleOperationFailed);

    return () => {
      syncManager.off('operation_added', handleOperationAdded);
      syncManager.off('operation_synced', handleOperationSynced);
      syncManager.off('operation_failed', handleOperationFailed);
    };
  }, [syncManager]);

  return { operations, isLoading };
}

// ============================================================================
// FAILED OPERATIONS HOOK
// ============================================================================

/**
 * Hook to monitor failed operations
 */
export function useFailedOperations(syncManager: OfflineSyncManager) {
  const [operations, setOperations] = useState<OfflineQueueTypes.QueuedOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setIsLoading(true);
        const failed = await syncManager.getFailedOperationsAsync();
        setOperations(failed);
      } catch (error) {
        console.error('[useFailedOperations] Error loading operations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOperations();

    // Listen for operation changes
    const handleOperationFailed = () => loadOperations();
    const handleOperationSynced = () => loadOperations();

    syncManager.on('operation_failed', handleOperationFailed);
    syncManager.on('operation_synced', handleOperationSynced);

    return () => {
      syncManager.off('operation_failed', handleOperationFailed);
      syncManager.off('operation_synced', handleOperationSynced);
    };
  }, [syncManager]);

  const retry = useCallback(
    async (operationId: string) => {
      try {
        await syncManager.syncOperation(operationId);
        await loadOperations();
      } catch (error) {
        console.error('[useFailedOperations] Error retrying operation:', error);
      }
    },
    [syncManager]
  );

  const loadOperations = useCallback(async () => {
    try {
      const failed = await syncManager.getFailedOperationsAsync();
      setOperations(failed);
    } catch (error) {
      console.error('[useFailedOperations] Error loading operations:', error);
    }
  }, [syncManager]);

  return { operations, isLoading, retry };
}

// ============================================================================
// MANUAL SYNC HOOK
// ============================================================================

/**
 * Hook to manually trigger sync
 */
export function useManualSync(syncManager: OfflineSyncManager) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const sync = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await syncManager.sync();
      setLastSyncTime(Date.now());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [syncManager]);

  return { sync, isLoading, error, lastSyncTime };
}

// ============================================================================
// QUEUE STATISTICS HOOK
// ============================================================================

export interface QueueStatistics {
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  conflicts: number;
}

/**
 * Hook to get queue statistics
 */
export function useQueueStatistics(syncManager: OfflineSyncManager): QueueStatistics {
  const [stats, setStats] = useState<QueueStatistics>({
    total: 0,
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    conflicts: 0,
  });

  useEffect(() => {
    const updateStats = async () => {
      try {
        const state = await syncManager.getStatusAsync();
        const operations = state.operations;

        setStats({
          total: operations.length,
          pending: operations.filter((op) => op.status === 'pending').length,
          syncing: operations.filter((op) => op.status === 'syncing').length,
          synced: operations.filter((op) => op.status === 'synced').length,
          failed: operations.filter((op) => op.status === 'failed').length,
          conflicts: operations.filter((op) => op.status === 'conflict').length,
        });
      } catch (error) {
        console.error('[useQueueStatistics] Error updating stats:', error);
      }
    };

    updateStats();

    // Listen for changes
    const handleChange = () => updateStats();

    syncManager.on('operation_added', handleChange);
    syncManager.on('operation_synced', handleChange);
    syncManager.on('operation_failed', handleChange);

    // Poll for updates
    const interval = setInterval(updateStats, 5000);

    return () => {
      syncManager.off('operation_added', handleChange);
      syncManager.off('operation_synced', handleChange);
      syncManager.off('operation_failed', handleChange);
      clearInterval(interval);
    };
  }, [syncManager]);

  return stats;
}
