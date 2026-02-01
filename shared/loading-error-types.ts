/**
 * Loading and Error State Types
 * Shared types for managing loading states and error handling across the app
 */

/**
 * Loading state enum
 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Async operation state
 */
export interface AsyncState<T = any> {
  state: LoadingState;
  data?: T;
  error?: Error;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

/**
 * Error information
 */
export interface ErrorInfo {
  code?: string;
  message: string;
  details?: string;
  timestamp: number;
  context?: Record<string, any>;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

/**
 * Loading indicator configuration
 */
export interface LoadingIndicatorConfig {
  show: boolean;
  message?: string;
  progress?: number;
  cancelable?: boolean;
  onCancel?: () => void;
}

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ReactNode;
  resetKeys?: Array<string | number>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Loading context state
 */
export interface LoadingContextState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
  setLoading: (loading: boolean, message?: string) => void;
  setProgress: (progress: number) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

/**
 * Error context state
 */
export interface ErrorContextState {
  error?: ErrorInfo;
  hasError: boolean;
  setError: (error: ErrorInfo | null) => void;
  clearError: () => void;
  showError: (message: string, details?: string, retryable?: boolean) => void;
}

/**
 * Toast context state
 */
export interface ToastContextState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
}

/**
 * Skeleton configuration
 */
export interface SkeletonConfig {
  width?: string | number;
  height?: string | number;
  count?: number;
  circle?: boolean;
  className?: string;
}

/**
 * Loading overlay configuration
 */
export interface LoadingOverlayConfig {
  visible: boolean;
  message?: string;
  progress?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Error display configuration
 */
export interface ErrorDisplayConfig {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

/**
 * Async operation result
 */
export interface AsyncResult<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  duration: number;
}

/**
 * Loading state hook return type
 */
export interface UseLoadingReturn {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T,>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Error handling hook return type
 */
export interface UseErrorReturn {
  error?: ErrorInfo;
  hasError: boolean;
  setError: (error: ErrorInfo | null) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
  withErrorHandling: <T,>(fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Combined async state hook return type
 */
export interface UseAsyncReturn<T = any> {
  state: LoadingState;
  data?: T;
  error?: ErrorInfo;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  retry: () => Promise<void>;
  reset: () => void;
}
