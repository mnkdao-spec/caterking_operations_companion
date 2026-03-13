'use client';

import { useState, FormEvent } from 'react';
import { Modal } from './modal';
import { ErrorDisplay, RetryButton } from './error-display';
import { LoadingSpinner } from './loading-spinner';
import { useToast } from '@/shared/toast-context';
import { useAsyncState } from '@/shared/use-async-state';
import { ErrorInfo } from '@/shared/loading-error-types';
import { createEvent, updateEvent } from '@/lib/supabase-services';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: any;
}

/**
 * Enhanced Event Form Component
 *
 * Includes loading states, error handling, retry logic, and toast notifications
 *
 * Features:
 * - Loading spinner during submission
 * - Detailed error display with retry button
 * - Toast notifications for success/error
 * - Disabled form inputs during submission
 * - Automatic error clearing on retry
 */
export function EventFormEnhanced({ isOpen, onClose, onSuccess, event }: EventFormProps) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    event_name: event?.event_name || '',
    event_date: event?.event_date || '',
    event_time: event?.event_time || '',
    venue_name: event?.venue_name || '',
    venue_address: event?.venue_address || '',
    guest_count: event?.guest_count || '',
    event_type: event?.event_type || 'wedding',
    status: event?.status || 'lead',
    budget: event?.budget || '',
    notes: event?.notes || '',
  });

  const [error, setError] = useState<ErrorInfo | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        guest_count: formData.guest_count ? parseInt(formData.guest_count as string) : null,
        budget: formData.budget ? parseFloat(formData.budget as string) : null,
      };

      if (event) {
        await updateEvent(event.id, dataToSubmit);
        showSuccess('Event updated successfully');
      } else {
        await createEvent(dataToSubmit);
        showSuccess('Event created successfully');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorInfo: ErrorInfo = {
        code: err.code || 'EVENT_FORM_ERROR',
        message: err.message || 'Failed to save event',
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
      title={event ? 'Edit Event' : 'Create New Event'}
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
            <LoadingSpinner size="lg" message="Saving event..." />
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* Event Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              placeholder="e.g., Smith Wedding Reception"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date *
            </label>
            <input
              type="date"
              required
              disabled={isSubmitting}
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Event Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Time
            </label>
            <input
              type="time"
              disabled={isSubmitting}
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type *
            </label>
            <select
              required
              disabled={isSubmitting}
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="wedding">Wedding</option>
              <option value="corporate">Corporate</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="holiday">Holiday Party</option>
              <option value="other">Other</option>
            </select>
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
              <option value="lead">Lead</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Count
            </label>
            <input
              type="number"
              min="1"
              disabled={isSubmitting}
              value={formData.guest_count}
              onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Venue Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Name
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              placeholder="e.g., Grand Ballroom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Venue Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Address
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              placeholder="123 Main St, City, State ZIP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
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
              placeholder="Special requests, dietary restrictions, etc."
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
                Saving...
              </>
            ) : event ? (
              'Update Event'
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
