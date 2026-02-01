/**
 * Toast Notification Context
 * Shared toast notification system for web and mobile
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast, ToastContextState } from './loading-error-types';
import { v4 as uuidv4 } from 'uuid';

const ToastContext = createContext<ToastContextState | undefined>(undefined);

/**
 * Toast Provider Component
 *
 * Provides toast notification functionality to the app
 *
 * Usage:
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id' | 'timestamp'>) => {
      const id = uuidv4();
      const newToast: Toast = {
        ...toast,
        id,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Keep only maxToasts
        return updated.slice(0, maxToasts);
      });

      // Auto-remove after duration
      if (toast.duration !== 0) {
        const duration = toast.duration ?? 5000;
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback(
    (message: string, description?: string) => {
      return addToast({
        type: 'success',
        message,
        description,
        duration: 5000,
      });
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, description?: string) => {
      return addToast({
        type: 'error',
        message,
        description,
        duration: 7000,
      });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, description?: string) => {
      return addToast({
        type: 'warning',
        message,
        description,
        duration: 6000,
      });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, description?: string) => {
      return addToast({
        type: 'info',
        message,
        description,
        duration: 5000,
      });
    },
    [addToast]
  );

  const value: ToastContextState = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * useToast Hook
 *
 * Access toast notification functionality
 *
 * Usage:
 * ```tsx
 * const { showSuccess, showError } = useToast();
 * showSuccess('Operation completed!');
 * ```
 */
export function useToast(): ToastContextState {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast Container Component (Web)
 *
 * Renders all active toasts
 *
 * Usage:
 * ```tsx
 * <ToastContainer />
 * ```
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Toast Item Component
 *
 * Individual toast notification
 */
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const bgColor = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const textColor = {
    success: 'text-green-900 dark:text-green-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
    info: 'text-blue-900 dark:text-blue-100',
  };

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`border rounded-lg p-4 flex gap-3 animate-in slide-in-from-right ${bgColor[toast.type]}`}
      role="alert"
    >
      <span className={`text-lg flex-shrink-0 ${textColor[toast.type]}`}>{icon[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${textColor[toast.type]}`}>{toast.message}</p>
        {toast.description && (
          <p className={`text-sm ${textColor[toast.type]} opacity-75 mt-1`}>{toast.description}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onClose();
            }}
            className={`text-sm font-medium ${textColor[toast.type]} hover:opacity-75`}
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className={`${textColor[toast.type]} hover:opacity-75 transition-opacity`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Toast Container Component (Mobile)
 *
 * Renders all active toasts for mobile
 *
 * Usage:
 * ```tsx
 * <MobileToastContainer />
 * ```
 */
export function MobileToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <MobileToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

/**
 * Mobile Toast Item Component
 */
function MobileToastItem({ toast, onClose }: ToastItemProps) {
  const bgColor = {
    success: 'bg-green-50 dark:bg-green-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
  };

  const textColor = {
    success: 'text-green-900 dark:text-green-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
    info: 'text-blue-900 dark:text-blue-100',
  };

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`mx-4 mb-3 rounded-lg p-4 flex gap-3 ${bgColor[toast.type]}`}>
      <span className={`text-lg flex-shrink-0 ${textColor[toast.type]}`}>{icon[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${textColor[toast.type]}`}>{toast.message}</p>
        {toast.description && (
          <p className={`text-sm ${textColor[toast.type]} opacity-75 mt-1`}>{toast.description}</p>
        )}
      </div>
      <button
        onPress={onClose}
        className={`${textColor[toast.type]} font-bold`}
      >
        ✕
      </button>
    </div>
  );
}
