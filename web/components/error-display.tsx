'use client';

import React from 'react';
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
 * Error Display Component
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
    <div
      className={cn(
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
            {error.message}
          </h3>
          {error.details && showDetails && (
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">{error.details}</p>
          )}
          {error.code && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">Error Code: {error.code}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Error Alert Component
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
    <div
      className={cn(
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 flex gap-3',
        className
      )}
    >
      <svg
        className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
        {details && <p className="text-sm text-red-800 dark:text-red-200 mt-1">{details}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Error Boundary Component
 *
 * Catches errors in child components and displays fallback UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Retry Button Component
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
    <button
      onClick={onRetry}
      disabled={isLoading || disabled}
      className={cn(
        'px-4 py-2 rounded-lg border border-border text-foreground font-medium',
        'hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center gap-2',
        className
      )}
    >
      {isLoading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            opacity="0.75"
          />
        </svg>
      )}
      {isLoading ? 'Retrying...' : 'Retry'}
    </button>
  );
}

/**
 * Error Page Component
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
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md">
        {code && <p className="text-6xl font-bold text-primary mb-4">{code}</p>}
        <h1 className="text-2xl font-bold text-foreground mb-2">{message}</h1>
        {details && <p className="text-muted mb-6">{details}</p>}

        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          )}
          {onHome && (
            <button
              onClick={onHome}
              className="px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-surface transition-colors"
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
