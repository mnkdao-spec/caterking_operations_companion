'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

/**
 * Loading Spinner Component
 *
 * Displays a loading spinner with optional message
 *
 * Usage:
 * ```tsx
 * <LoadingSpinner size="lg" message="Loading events..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  message,
  fullScreen = false,
  overlay = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={cn('animate-spin', sizeClasses[size])}>
        <svg
          className="w-full h-full text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {message && <p className="text-sm text-muted text-center">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-40">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Skeleton Loader Component
 *
 * Displays a skeleton placeholder while content is loading
 *
 * Usage:
 * ```tsx
 * <Skeleton width="100%" height="20px" count={3} />
 * ```
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  count?: number;
  circle?: boolean;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  count = 1,
  circle = false,
  className,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gradient-to-r from-surface via-border to-surface animate-pulse',
            circle && 'rounded-full',
            !circle && 'rounded-lg',
            className
          )}
          style={{
            width: widthStyle,
            height: heightStyle,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Card Skeleton Component
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
    <div className="space-y-4">
      {items.map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <Skeleton width="60%" height="24px" />
          <Skeleton width="100%" height="16px" count={2} />
          <div className="flex gap-2 pt-2">
            <Skeleton width="80px" height="32px" />
            <Skeleton width="80px" height="32px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton Component
 *
 * Displays a skeleton for a table layout
 *
 * Usage:
 * ```tsx
 * <TableSkeleton rows={5} columns={4} />
 * ```
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 p-4 bg-surface border-b border-border" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="100%" height="20px" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-4 p-4 border-b border-border last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} width="100%" height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Loading Overlay Component
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
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <LoadingSpinner size="lg" message={message} />
        {dismissible && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
