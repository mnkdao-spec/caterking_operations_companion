'use client';

import { useEffect, useState } from 'react';
import { useOfflineSync } from '@/shared/use-offline-sync-simple';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  /**
   * Size variant: compact for header, expanded for full display
   */
  variant?: 'compact' | 'expanded';
  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * OfflineIndicator Component (Web)
 *
 * Displays the current online/offline status with:
 * - Online/offline status indicator
 * - Pending operation count
 * - Last sync timestamp
 * - Animated sync spinner
 *
 * Usage:
 * ```tsx
 * // In header
 * <OfflineIndicator variant="compact" />
 *
 * // Full display
 * <OfflineIndicator variant="expanded" />
 * ```
 */
export function OfflineIndicator({ variant = 'compact', className }: OfflineIndicatorProps) {
  const { isOnline, pendingCount, lastSync, isSyncing } = useOfflineSync();
  const [isAnimating, setIsAnimating] = useState(false);

  // Control animation state
  useEffect(() => {
    setIsAnimating(isSyncing);
  }, [isSyncing]);

  // Format last sync time
  const formatSyncTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'Earlier';
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 px-2 py-1', className)}>
        {/* Status indicator dot */}
        <div
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )}
        />

        {/* Status text */}
        <span className="text-xs text-muted font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Pending count badge */}
        {pendingCount > 0 && (
          <div className="bg-yellow-500 rounded-full px-1.5 py-0.5 ml-1">
            <span className="text-xs text-white font-semibold">
              {pendingCount}
            </span>
          </div>
        )}

        {/* Sync spinner */}
        {isSyncing && (
          <div className={cn('text-xs text-muted', isAnimating && 'animate-spin')}>
            ⟳
          </div>
        )}
      </div>
    );
  }

  // Expanded variant
  return (
    <div className={cn('bg-surface rounded-lg p-4 border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">Sync Status</h3>
        {isSyncing && (
          <div className={cn('text-lg text-muted', isAnimating && 'animate-spin')}>
            ⟳
          </div>
        )}
      </div>

      {/* Status section */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full transition-colors',
              isOnline ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <p className="text-base font-medium text-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <p className="text-sm text-muted">
          {isOnline
            ? 'Connected to server'
            : 'Changes will sync when connection restored'}
        </p>
      </div>

      {/* Pending operations section */}
      {pendingCount > 0 && (
        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
            </p>
          </div>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
            {isSyncing ? 'Syncing now...' : 'Will sync automatically'}
          </p>
        </div>
      )}

      {/* Last sync section */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted">
          Last sync: <span className="font-medium">{formatSyncTime(lastSync)}</span>
        </p>
      </div>
    </div>
  );
}
