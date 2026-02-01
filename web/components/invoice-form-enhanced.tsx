'use client';

import { useState, FormEvent } from 'react';
import { Modal } from './modal';
import { ErrorDisplay } from './error-display';
import { LoadingSpinner } from './loading-spinner';
import { useToast } from '@/shared/toast-context';
import { ErrorInfo } from '@/shared/loading-error-types';

interface InvoiceFormEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId?: string;
  invoice?: any;
}

/**
 * Enhanced Invoice Generation Form Component
 *
 * Includes loading states, error handling, retry logic, and toast notifications
 *
 * Features:
 * - Loading spinner during invoice generation
 * - Detailed error display with retry button
 * - Toast notifications for success/error
 * - Disabled form inputs during submission
 * - Automatic error clearing on retry
 * - Support for both new and existing invoices
 */
export function InvoiceFormEnhanced({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  invoice,
}: InvoiceFormEnhancedProps) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    invoice_number: invoice?.invoice_number || '',
    status: invoice?.status || 'draft',
    notes: invoice?.notes || '',
    tax_rate: invoice?.tax_rate || '10',
  });

  const [error, setError] = useState<ErrorInfo | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        event_id: eventId,
        tax_rate: parseFloat(formData.tax_rate),
      };

      // TODO: Integrate with actual API calls
      // if (invoice) {
      //   await updateInvoice(invoice.id, dataToSubmit);
      //   showSuccess('Invoice updated successfully');
      // } else {
      //   await generateInvoice(dataToSubmit);
      //   showSuccess('Invoice generated successfully');
      // }

      showSuccess(invoice ? 'Invoice updated successfully' : 'Invoice generated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorInfo: ErrorInfo = {
        code: err.code || 'INVOICE_FORM_ERROR',
        message: err.message || 'Failed to generate invoice',
        details: err.details || 'Please check your input and try again',
        timestamp: Date.now(),
        retryable: true,
        context: { error: err },
      };

      setError(errorInfo);
      showError(errorInfo.message, errorInfo.details);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const handleRetry = async () => {
    await submitForm();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? 'Edit Invoice' : 'Generate Invoice'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="space-y-3">
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={() => setError(undefined)}
              showDetails={true}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-50">
            <LoadingSpinner size="lg" message="Generating invoice..." />
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* Invoice Number */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              placeholder="e.g., INV-2026-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              disabled={isSubmitting}
              value={formData.invoice_date}
              onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              disabled={isSubmitting}
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              disabled={isSubmitting}
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              required
              disabled={isSubmitting}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional invoice notes or payment terms"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    opacity="0.75"
                  />
                </svg>
                Generating...
              </>
            ) : invoice ? (
              'Update Invoice'
            ) : (
              'Generate Invoice'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
