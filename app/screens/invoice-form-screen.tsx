import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ErrorDisplay } from '@/components/error-display';
import { LoadingOverlay } from '@/components/loading-spinner';
import { useToast } from '@/shared/toast-context';
import { ErrorInfo } from '@/shared/loading-error-types';
import { cn } from '@/lib/utils';

interface InvoiceFormScreenProps {
  eventId?: string;
  invoice?: any;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Mobile Invoice Form Screen
 *
 * Includes loading states, error handling, and toast notifications
 *
 * Features:
 * - Loading spinner during invoice generation
 * - Detailed error display with retry button
 * - Toast notifications for success/error
 * - Disabled form inputs during submission
 * - Mobile-optimized layout
 */
export function InvoiceFormScreen({
  eventId,
  invoice,
  onSuccess,
  onClose,
}: InvoiceFormScreenProps) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    invoice_number: invoice?.invoice_number || '',
    status: invoice?.status || 'draft',
    notes: invoice?.notes || '',
    tax_rate: invoice?.tax_rate?.toString() || '10',
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
              {invoice ? 'Edit Invoice' : 'Generate Invoice'}
            </Text>
            <Text className="text-sm text-muted">
              {invoice ? 'Update invoice details' : 'Create a new invoice'}
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
            {/* Invoice Number */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Invoice Number *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.invoice_number}
                onChangeText={(text) => setFormData({ ...formData, invoice_number: text })}
                placeholder="INV-2026-001"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Invoice Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Invoice Date *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.invoice_date}
                onChangeText={(text) => setFormData({ ...formData, invoice_date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Due Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Due Date *</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.due_date}
                onChangeText={(text) => setFormData({ ...formData, due_date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Tax Rate */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Tax Rate (%)</Text>
              <TextInput
                editable={!isSubmitting}
                value={formData.tax_rate}
                onChangeText={(text) => setFormData({ ...formData, tax_rate: text })}
                placeholder="10"
                placeholderTextColor="#9BA1A6"
                keyboardType="decimal-pad"
                className="border border-border rounded-lg px-3 py-2 text-foreground"
              />
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
                placeholder="Payment terms or additional notes..."
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
                {isSubmitting ? 'Generating...' : invoice ? 'Update Invoice' : 'Generate Invoice'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isSubmitting} message="Generating invoice..." />
    </ScreenContainer>
  );
}
