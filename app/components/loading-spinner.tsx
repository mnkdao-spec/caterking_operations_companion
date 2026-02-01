import { View, Text, ActivityIndicator, Modal } from 'react-native';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  color?: string;
}

/**
 * Loading Spinner Component (Mobile)
 *
 * Displays a loading spinner with optional message
 *
 * Usage:
 * ```tsx
 * <LoadingSpinner size="large" message="Loading events..." />
 * ```
 */
export function LoadingSpinner({
  size = 'large',
  message,
  color = '#0a7ea4',
}: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size={size} color={color} />
      {message && <Text className="text-sm text-muted mt-3 text-center">{message}</Text>}
    </View>
  );
}

/**
 * Skeleton Loader Component (Mobile)
 *
 * Displays a skeleton placeholder while content is loading
 *
 * Usage:
 * ```tsx
 * <Skeleton width="100%" height={20} count={3} />
 * ```
 */
interface SkeletonProps {
  width?: string | number;
  height?: number;
  count?: number;
  circle?: boolean;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  count = 1,
  circle = false,
  className,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  const widthValue = typeof width === 'number' ? width : width === '100%' ? '100%' : parseInt(width as string);

  return (
    <View className="gap-2">
      {items.map((_, i) => (
        <View
          key={i}
          className={cn(
            'bg-surface',
            circle && 'rounded-full',
            !circle && 'rounded-lg',
            className
          )}
          style={{
            width: widthValue === '100%' ? '100%' : widthValue,
            height,
            opacity: 0.6,
          }}
        />
      ))}
    </View>
  );
}

/**
 * Card Skeleton Component (Mobile)
 *
 * Displays a skeleton for a card layout
 *
 * Usage:
 * ```tsx
 * <CardSkeleton count={3} />
 * ```
 */
interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 1 }: CardSkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <View className="gap-4">
      {items.map((_, i) => (
        <View key={i} className="border border-border rounded-lg p-4 gap-3">
          <Skeleton width="60%" height={24} />
          <Skeleton width="100%" height={16} count={2} />
          <View className="flex-row gap-2 pt-2">
            <Skeleton width={80} height={32} />
            <Skeleton width={80} height={32} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Loading Overlay Component (Mobile)
 *
 * Full-screen loading overlay with optional message
 *
 * Usage:
 * ```tsx
 * <LoadingOverlay visible={isLoading} message="Saving..." />
 * ```
 */
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function LoadingOverlay({
  visible,
  message,
  dismissible = false,
  onDismiss,
}: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-surface rounded-2xl p-6 max-w-xs w-11/12">
          <LoadingSpinner size="large" message={message} />
          {dismissible && (
            <Text
              onPress={onDismiss}
              className="mt-4 text-center text-sm text-muted active:opacity-70"
            >
              Dismiss
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Shimmer Skeleton Component (Mobile)
 *
 * Animated skeleton with shimmer effect
 *
 * Usage:
 * ```tsx
 * <ShimmerSkeleton width="100%" height={20} />
 * ```
 */
interface ShimmerSkeletonProps {
  width?: string | number;
  height?: number;
  count?: number;
  circle?: boolean;
}

export function ShimmerSkeleton({
  width = '100%',
  height = 20,
  count = 1,
  circle = false,
}: ShimmerSkeletonProps) {
  const items = Array.from({ length: count });
  const widthValue = typeof width === 'number' ? width : width === '100%' ? '100%' : parseInt(width as string);

  return (
    <View className="gap-2">
      {items.map((_, i) => (
        <View
          key={i}
          className={cn(
            'bg-gradient-to-r from-surface via-border to-surface',
            circle && 'rounded-full',
            !circle && 'rounded-lg'
          )}
          style={{
            width: widthValue === '100%' ? '100%' : widthValue,
            height,
          }}
        />
      ))}
    </View>
  );
}
