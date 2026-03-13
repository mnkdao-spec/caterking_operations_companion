import { useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
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
 * OfflineIndicator Component
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
  const [spinValue] = useState(new Animated.Value(0));

  // Animate spinner when syncing
  useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isSyncing, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
      <View className={cn('flex-row items-center gap-2 px-2 py-1', className)}>
        {/* Status indicator dot */}
        <View
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )}
        />

        {/* Status text */}
        <Text className="text-xs text-muted font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </Text>

        {/* Pending count badge */}
        {pendingCount > 0 && (
          <View className="bg-yellow-500 rounded-full px-1.5 py-0.5 ml-1">
            <Text className="text-xs text-white font-semibold">
              {pendingCount}
            </Text>
          </View>
        )}

        {/* Sync spinner */}
        {isSyncing && (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Text className="text-xs text-muted">⟳</Text>
          </Animated.View>
        )}
      </View>
    );
  }

  // Expanded variant
  return (
    <View className={cn('bg-surface rounded-lg p-4 border border-border', className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-foreground">Sync Status</Text>
        {isSyncing && (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Text className="text-lg text-muted">⟳</Text>
          </Animated.View>
        )}
      </View>

      {/* Status section */}
      <View className="mb-3">
        <View className="flex-row items-center gap-2 mb-2">
          <View
            className={cn(
              'w-3 h-3 rounded-full',
              isOnline ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <Text className="text-base font-medium text-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <Text className="text-sm text-muted">
          {isOnline
            ? 'Connected to server'
            : 'Changes will sync when connection restored'}
        </Text>
      </View>

      {/* Pending operations section */}
      {pendingCount > 0 && (
        <View className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-yellow-500" />
            <Text className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
            </Text>
          </View>
          <Text className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
            {isSyncing ? 'Syncing now...' : 'Will sync automatically'}
          </Text>
        </View>
      )}

      {/* Last sync section */}
      <View className="pt-2 border-t border-border">
        <Text className="text-xs text-muted">
          Last sync: <Text className="font-medium">{formatSyncTime(lastSync)}</Text>
        </Text>
      </View>
    </View>
  );
}
