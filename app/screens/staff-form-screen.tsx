import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ErrorDisplay } from '@/components/error-display';
import { LoadingOverlay } from '@/components/loading-spinner';
import { useToast } from '@/shared/toast-context';
import { ErrorInfo } from '@/shared/loading-error-types';
import { cn } from '@/lib/utils';

interface StaffFormScreenProps {
  staff?: any;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Mobile Staff Form Screen
 *
 * Includes loading states, error handling, and toast notifications
 *
 * Features:
 * - Loading spinner during submission
 * - Detailed error display with retry button
 * - Toast notifications for success/error
 * - Disabled form inputs during submission
 * - Mobile-optimized layout
 */
export function StaffFormScreen({ staff, onSuccess, onClose }: StaffFormScreenProps) {
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
    hourly_rate: staff?.hourly_rate?.toString() || '',
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
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };

      // TODO: Integrate with actual API calls
      // if (staff) {
      //   await updateStaff(staff.id, dataToSubmit);
      //   showSuccess('Staff member updated successfully');
      // } else {
      //   await createStaff(dataToSubmit);
      //   showSuccess('Staff member added successfully');
      // }

      showSuccess(staff ? 'Staff member updated successfully' : 'Staff member added successfully');
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

  const handleSubmit = async () => {
    await submitForm();
  };

  const handleRetry = async () => {
    await submitForm();
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-4 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              {staff ? 'Edit Staff Member' : 'Add Staff Member'}
            </Text>
            <Text className="text-sm text-muted">
              {staff ? 'Update staff details' : 'Add a new team member'}
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View className="gap-3">
              <ErrorDisplay
                error={error}
                onRetry={handleRetry}
                onDismiss={() => setError(undefined)}
                showDetails={true}
              />
            </View>
          )}

          {/* Form Fields */}
          <View className="gap-4">
            {/* First Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">First Name *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.first_name}
                onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                placeholder="John"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Last Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Last Name *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.last_name}
                onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                placeholder="Doe"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Email */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Email</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="john@example.com"
                placeholderTextColor="#9BA1A6"
                keyboardType="email-address"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Phone */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Phone</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9BA1A6"
                keyboardType="phone-pad"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Role */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Role *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.role}
                onChangeText={(text) => setFormData({ ...formData, role: text })}
                placeholder="Head Chef"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Department */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Department *</Text>
              <View className="border border-border rounded-lg px-3 py-2">
                <Text className="text-foreground capitalize">{formData.department}</Text>
              </View>
            </View>

            {/* Hire Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Hire Date</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.hire_date}
                onChangeText={(text) => setFormData({ ...formData, hire_date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Hourly Rate */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Hourly Rate ($)</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.hourly_rate}
                onChangeText={(text) => setFormData({ ...formData, hourly_rate: text })}
                placeholder="25.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="decimal-pad"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Certification Level */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Certification Level</Text>
              <View className="border border-border rounded-lg px-3 py-2">
                <Text className="text-foreground capitalize">{formData.certification_level}</Text>
              </View>
            </View>

            {/* Status */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Status *</Text>
              <View className="border border-border rounded-lg px-3 py-2">
                <Text className="text-foreground capitalize">{formData.status}</Text>
              </View>
            </View>

            {/* Notes */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Notes</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Additional notes..."
                placeholderTextColor="#9BA1A6"
                multiline
                numberOfLines={4}
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 pt-4 border-t border-border">
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border border-border items-center',
                isSubmitting && 'opacity-50'
              )}
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg bg-primary items-center flex-row justify-center gap-2',
                isSubmitting && 'opacity-50'
              )}
            >
              {isSubmitting && <ActivityIndicator color="white" size="small" />}
              <Text className="text-white font-semibold">
                {isSubmitting ? 'Saving...' : staff ? 'Update Staff' : 'Add Staff'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isSubmitting} message="Saving staff member..." />
    </ScreenContainer>
  );
}
