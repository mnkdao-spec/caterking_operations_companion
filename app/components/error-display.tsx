import { View, Text, Pressable, ScrollView } from 'react-native';
import { ErrorInfo } from '@/shared/loading-error-types';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * Error Display Component (Mobile)
 *
 * Shows error message with optional retry and dismiss buttons
 *
 * Usage:
 * ```tsx
 * <ErrorDisplay
 *   error={error}
 *   onRetry={handleRetry}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className,
}: ErrorDisplayProps) {
  return (
    <View
      className={cn(
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4',
        className
      )}
    >
      {/* Header */}
      <View className="flex-row gap-3">
        <View className="flex-shrink-0 mt-0.5">
          <Text className="text-red-600 dark:text-red-400 text-lg">⚠️</Text>
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-red-900 dark:text-red-100">
            {error.message}
          </Text>
          {error.details && showDetails && (
            <Text className="text-sm text-red-800 dark:text-red-200 mt-1">{error.details}</Text>
          )}
          {error.code && (
            <Text className="text-xs text-red-700 dark:text-red-300 mt-1">
              Error Code: {error.code}
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2 mt-4">
        {error.retryable && onRetry && (
          <Pressable
            onPress={onRetry}
            className="px-3 py-2 rounded bg-red-100 dark:bg-red-900/30 active:opacity-70"
          >
            <Text className="text-sm font-medium text-red-700 dark:text-red-200">Retry</Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable onPress={onDismiss} className="px-3 py-2 rounded active:opacity-70">
            <Text className="text-sm font-medium text-red-700 dark:text-red-200">Dismiss</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Error Alert Component (Mobile)
 *
 * Inline error alert with icon and message
 *
 * Usage:
 * ```tsx
 * <ErrorAlert message="Failed to load events" />
 * ```
 */
interface ErrorAlertProps {
  message: string;
  details?: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorAlert({
  message,
  details,
  onClose,
  className,
}: ErrorAlertProps) {
  return (
    <View
      className={cn(
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 flex-row gap-3',
        className
      )}
    >
      <Text className="text-red-600 dark:text-red-400 text-lg">⚠️</Text>
      <View className="flex-1">
        <Text className="text-sm font-medium text-red-900 dark:text-red-100">{message}</Text>
        {details && <Text className="text-sm text-red-800 dark:text-red-200 mt-1">{details}</Text>}
      </View>
      {onClose && (
        <Pressable onPress={onClose} className="active:opacity-70">
          <Text className="text-red-700 dark:text-red-200 text-lg">✕</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Retry Button Component (Mobile)
 *
 * Button that triggers retry with loading state
 *
 * Usage:
 * ```tsx
 * <RetryButton onRetry={handleRetry} isLoading={isLoading} />
 * ```
 */
interface RetryButtonProps {
  onRetry: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RetryButton({
  onRetry,
  isLoading = false,
  disabled = false,
  className,
}: RetryButtonProps) {
  return (
    <Pressable
      onPress={onRetry}
      disabled={isLoading || disabled}
      className={cn(
        'px-4 py-2 rounded-lg border border-border',
        isLoading || disabled ? 'opacity-50' : 'active:opacity-70',
        className
      )}
    >
      <Text className="text-foreground font-medium text-center">
        {isLoading ? 'Retrying...' : 'Retry'}
      </Text>
    </Pressable>
  );
}

/**
 * Error Page Component (Mobile)
 *
 * Full-page error display
 *
 * Usage:
 * ```tsx
 * <ErrorPage
 *   code="500"
 *   message="Server Error"
 *   onRetry={handleRetry}
 * />
 * ```
 */
interface ErrorPageProps {
  code?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onHome?: () => void;
}

export function ErrorPage({
  code,
  message,
  details,
  onRetry,
  onHome,
}: ErrorPageProps) {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center min-h-screen px-4 py-8">
        <View className="items-center max-w-xs">
          {code && <Text className="text-6xl font-bold text-primary mb-4">{code}</Text>}
          <Text className="text-2xl font-bold text-foreground mb-2 text-center">{message}</Text>
          {details && <Text className="text-muted mb-6 text-center">{details}</Text>}

          <View className="flex-row gap-3 justify-center">
            {onRetry && (
              <Pressable
                onPress={onRetry}
                className="px-4 py-2 rounded-lg bg-primary active:opacity-70"
              >
                <Text className="text-white font-medium">Try Again</Text>
              </Pressable>
            )}
            {onHome && (
              <Pressable
                onPress={onHome}
                className="px-4 py-2 rounded-lg border border-border active:opacity-70"
              >
                <Text className="text-foreground font-medium">Go Home</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
