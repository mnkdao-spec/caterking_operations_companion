/**
 * useAsyncState Hook
 * Manages loading, error, and success states for async operations
 */

import { useState, useCallback, useRef } from 'react';
import { LoadingState, AsyncState, ErrorInfo, UseAsyncReturn } from './loading-error-types';

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Hook for managing async operation state
 *
 * Usage:
 * ```tsx
 * const { state, data, error, isLoading, retry } = useAsyncState(
 *   async () => {
 *     const response = await fetch('/api/events');
 *     return response.json();
 *   }
 * );
 * ```
 */
export function useAsyncState<T = any>(
  asyncFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ErrorInfo) => void;
    autoExecute?: boolean;
  }
): UseAsyncReturn<T> {
  const [state, setState] = useState<LoadingState>(LoadingState.IDLE);
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<ErrorInfo | undefined>();
  const retryCountRef = useRef(0);

  const execute = useCallback(async () => {
    setState(LoadingState.LOADING);
    setError(undefined);

    try {
      const result = await asyncFn();
      setData(result);
      setState(LoadingState.SUCCESS);
      options?.onSuccess?.(result);
      retryCountRef.current = 0;
      return result;
    } catch (err) {
      const errorInfo: ErrorInfo = {
        message: err instanceof Error ? err.message : 'An error occurred',
        code: (err as any)?.code,
        details: (err as any)?.details,
        timestamp: Date.now(),
        context: { error: err },
        retryable: true,
        retryCount: retryCountRef.current,
        maxRetries: DEFAULT_RETRY_CONFIG.maxRetries,
      };

      setError(errorInfo);
      setState(LoadingState.ERROR);
      options?.onError?.(errorInfo);
      throw err;
    }
  }, [asyncFn, options]);

  const retry = useCallback(async () => {
    if (retryCountRef.current < DEFAULT_RETRY_CONFIG.maxRetries) {
      retryCountRef.current++;
      const delay = Math.min(
        DEFAULT_RETRY_CONFIG.initialDelay * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, retryCountRef.current - 1),
        DEFAULT_RETRY_CONFIG.maxDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return execute();
    }
    throw new Error('Max retries exceeded');
  }, [execute]);

  const reset = useCallback(() => {
    setState(LoadingState.IDLE);
    setData(undefined);
    setError(undefined);
    retryCountRef.current = 0;
  }, []);

  return {
    state,
    data,
    error,
    isLoading: state === LoadingState.LOADING,
    isError: state === LoadingState.ERROR,
    isSuccess: state === LoadingState.SUCCESS,
    isIdle: state === LoadingState.IDLE,
    retry,
    reset,
  };
}

/**
 * Hook for managing loading state
 *
 * Usage:
 * ```tsx
 * const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
 *
 * const handleSave = async () => {
 *   await withLoading(async () => {
 *     await api.save(data);
 *   });
 * };
 * ```
 */
export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    setLoading: setIsLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * Hook for managing error state
 *
 * Usage:
 * ```tsx
 * const { error, hasError, setError, clearError, handleError } = useError();
 *
 * const handleOperation = async () => {
 *   try {
 *     await api.operation();
 *   } catch (err) {
 *     handleError(err, 'Operation failed');
 *   }
 * };
 * ```
 */
export function useError() {
  const [error, setErrorState] = useState<ErrorInfo | undefined>();

  const setError = useCallback((err: ErrorInfo | null) => {
    if (err === null) {
      setErrorState(undefined);
    } else {
      setErrorState(err);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(undefined);
  }, []);

  const handleError = useCallback(
    (err: unknown, context?: string) => {
      const errorInfo: ErrorInfo = {
        message: err instanceof Error ? err.message : 'An error occurred',
        code: (err as any)?.code,
        details: context,
        timestamp: Date.now(),
        context: { error: err },
        retryable: true,
      };
      setError(errorInfo);
    },
    [setError]
  );

  const withErrorHandling = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        clearError();
        return await fn();
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [clearError, handleError]
  );

  return {
    error,
    hasError: !!error,
    setError,
    clearError,
    handleError,
    withErrorHandling,
  };
}

/**
 * Hook for combined loading and error state
 *
 * Usage:
 * ```tsx
 * const { isLoading, error, execute } = useAsyncOperation(
 *   async () => {
 *     const data = await api.fetch();
 *     return data;
 *   }
 * );
 * ```
 */
export function useAsyncOperation<T = any>(
  asyncFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ErrorInfo) => void;
  }
) {
  const asyncState = useAsyncState(asyncFn, options);
  const { isLoading, error } = asyncState;

  return {
    isLoading,
    error,
    ...asyncState,
  };
}
