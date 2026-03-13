'use client';

import { useState, FormEvent } from 'react';
import { Modal } from './modal';
import { ErrorDisplay } from './error-display';
import { LoadingSpinner } from './loading-spinner';
import { useToast } from '@/shared/toast-context';
import { ErrorInfo } from '@/shared/loading-error-types';
import { createStaff, updateStaff } from '@/lib/supabase-services';

interface StaffFormEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff?: any;
}

/**
 * Enhanced Staff Form Component
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
export function StaffFormEnhanced({ isOpen, onClose, onSuccess, staff }: StaffFormEnhancedProps) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || '',
    department: staff?.department || 'kitchen',
    status: staff?.status || 'active',
    hire_date: staff?.hire_date || '',
    hourly_rate: staff?.hourly_rate || '',
    certification_level: staff?.certification_level || 'intermediate',
    notes: staff?.notes || '',
  });

  const [error, setError] = useState<ErrorInfo | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate as string) : null,
      };

      if (staff) {
        await updateStaff(staff.id, dataToSubmit);
        showSuccess('Staff member updated successfully');
      } else {
        await createStaff(dataToSubmit);
        showSuccess('Staff member added successfully');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorInfo: ErrorInfo = {
        code: err.code || 'STAFF_FORM_ERROR',
        message: err.message || 'Failed to save staff member',
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
      title={staff ? 'Edit Staff Member' : 'Add New Staff Member'}
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
            <LoadingSpinner size="lg" message="Saving staff member..." />
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled={isSubmitting}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              disabled={isSubmitting}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Head Chef, Server, Bartender"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              required
              disabled={isSubmitting}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="kitchen">Kitchen</option>
              <option value="service">Service</option>
              <option value="management">Management</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hire Date
            </label>
            <input
              type="date"
              disabled={isSubmitting}
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Certification Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certification Level
            </label>
            <select
              disabled={isSubmitting}
              value={formData.certification_level}
              onChange={(e) => setFormData({ ...formData, certification_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="junior">Junior</option>
              <option value="intermediate">Intermediate</option>
              <option value="senior">Senior</option>
              <option value="master">Master</option>
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
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
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
            ) : staff ? (
              'Update Staff'
            ) : (
              'Add Staff'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
