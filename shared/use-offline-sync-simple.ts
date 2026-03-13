/**
 * Simplified Offline Sync Hook
 * Provides easy access to sync status for UI components
 */

import { useEffect, useState } from 'react';

export interface SimpleSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSync: number | null;
}

/**
 * Simple hook for displaying offline sync status
 * Monitors browser online/offline events and provides sync state
 *
 * Usage:
 * ```tsx
 * const { isOnline, isSyncing, pendingCount, lastSync } = useOfflineSync();
 * ```
 */
export function useOfflineSync(): SimpleSyncStatus {
  const [status, setStatus] = useState<SimpleSyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSync: null,
  });

  useEffect(() => {
    // Handle online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    // Get initial online status
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setStatus((prev) => ({ ...prev, isOnline }));

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending operations in localStorage
    const checkPendingOperations = () => {
      try {
        const queueData = localStorage.getItem('offline_queue');
        if (queueData) {
          const queue = JSON.parse(queueData);
          const pending = queue.filter((op: any) => op.status === 'pending').length;
          setStatus((prev) => ({
            ...prev,
            pendingCount: pending,
            lastSync: localStorage.getItem('last_sync_time')
              ? parseInt(localStorage.getItem('last_sync_time') || '0')
              : null,
          }));
        }
      } catch (error) {
        console.error('[useOfflineSync] Error checking pending operations:', error);
      }
    };

    checkPendingOperations();

    // Poll for pending operations every 2 seconds
    const interval = setInterval(checkPendingOperations, 2000);

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'offline_queue' || e.key === 'last_sync_time') {
        checkPendingOperations();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return status;
}
