import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ErrorDisplay, RetryButton } from '@/components/error-display';
import { LoadingSpinner, LoadingOverlay } from '@/components/loading-spinner';
import { useToast } from '@/shared/toast-context';
import { ErrorInfo } from '@/shared/loading-error-types';
import { cn } from '@/lib/utils';

interface EventFormScreenProps {
  event?: any;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Mobile Event Form Screen
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
export function EventFormScreen({ event, onSuccess, onClose }: EventFormScreenProps) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    event_name: event?.event_name || '',
    event_date: event?.event_date || '',
    event_time: event?.event_time || '',
    venue_name: event?.venue_name || '',
    venue_address: event?.venue_address || '',
    guest_count: event?.guest_count?.toString() || '',
    event_type: event?.event_type || 'wedding',
    status: event?.status || 'lead',
    budget: event?.budget?.toString() || '',
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
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      // TODO: Integrate with actual API calls
      // if (event) {
      //   await updateEvent(event.id, dataToSubmit);
      //   showSuccess('Event updated successfully');
      // } else {
      //   await createEvent(dataToSubmit);
      //   showSuccess('Event created successfully');
      // }

      showSuccess(event ? 'Event updated successfully' : 'Event created successfully');
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
              {event ? 'Edit Event' : 'Create New Event'}
            </Text>
            <Text className="text-sm text-muted">
              {event ? 'Update event details' : 'Add a new catering event'}
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
            {/* Event Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Event Name *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.event_name}
                onChangeText={(text) => setFormData({ ...formData, event_name: text })}
                placeholder="e.g., Smith Wedding Reception"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Event Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Event Date *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.event_date}
                onChangeText={(text) => setFormData({ ...formData, event_date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Event Time */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Event Time</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.event_time}
                onChangeText={(text) => setFormData({ ...formData, event_time: text })}
                placeholder="HH:MM"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Event Type */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Event Type *</Text>
              <View className="border border-border rounded-lg px-3 py-2">
                <Text className="text-foreground">{formData.event_type}</Text>
              </View>
            </View>

            {/* Status */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Status *</Text>
              <View className="border border-border rounded-lg px-3 py-2">
                <Text className="text-foreground">{formData.status}</Text>
              </View>
            </View>

            {/* Guest Count */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Guest Count</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.guest_count}
                onChangeText={(text) => setFormData({ ...formData, guest_count: text })}
                placeholder="0"
                placeholderTextColor="#9BA1A6"
                keyboardType="number-pad"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Budget */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Budget ($)</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.budget}
                onChangeText={(text) => setFormData({ ...formData, budget: text })}
                placeholder="0.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="decimal-pad"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Venue Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Venue Name</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.venue_name}
                onChangeText={(text) => setFormData({ ...formData, venue_name: text })}
                placeholder="e.g., Grand Ballroom"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Venue Address */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Venue Address</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.venue_address}
                onChangeText={(text) => setFormData({ ...formData, venue_address: text })}
                placeholder="123 Main St, City, State ZIP"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Notes */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Notes</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Special requests, dietary restrictions, etc."
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
                {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isSubmitting} message="Saving event..." />
    </ScreenContainer>
  );
}
