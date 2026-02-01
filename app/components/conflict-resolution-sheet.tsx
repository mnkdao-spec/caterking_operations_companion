import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { EntityConflict, FieldConflict, ConflictResolutionStrategy } from '@/shared/conflict-resolution-types';
import { ConflictDetector } from '@/shared/conflict-detector';
import { cn } from '@/lib/utils';

interface ConflictResolutionSheetProps {
  conflict: EntityConflict;
  isOpen: boolean;
  onResolve: (strategy: ConflictResolutionStrategy, selectedFields?: Record<string, 'local' | 'remote'>) => void;
  onCancel: () => void;
}

/**
 * Conflict Resolution Sheet Component (Mobile)
 *
 * Mobile-optimized bottom sheet for resolving conflicts between local and remote versions
 *
 * Usage:
 * ```tsx
 * <ConflictResolutionSheet
 *   conflict={conflict}
 *   isOpen={true}
 *   onResolve={(strategy) => handleResolve(strategy)}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
export function ConflictResolutionSheet({
  conflict,
  isOpen,
  onResolve,
  onCancel,
}: ConflictResolutionSheetProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy>('keep_local');
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'local' | 'remote'>>({});

  const handleFieldSelection = (fieldName: string, version: 'local' | 'remote') => {
    setFieldSelections((prev) => ({
      ...prev,
      [fieldName]: version,
    }));
  };

  const handleResolve = () => {
    if (selectedStrategy === 'merge_manual') {
      onResolve(selectedStrategy, fieldSelections);
    } else {
      onResolve(selectedStrategy);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[90%]">
          {/* Handle Bar */}
          <View className="items-center pt-3 pb-4">
            <View className="w-12 h-1 bg-muted rounded-full" />
          </View>

          {/* Header */}
          <View className="px-4 pb-4 border-b border-border">
            <Text className="text-2xl font-bold text-foreground">Resolve Conflict</Text>
            <Text className="text-sm text-muted mt-1">
              This {conflict.entityType} was modified both offline and online
            </Text>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Strategy Selection */}
            <View className="mb-6">
              <Text className="font-semibold text-foreground mb-3">Resolution Strategy</Text>

              {/* Keep Local */}
              <StrategyOption
                label="Keep Local Changes"
                description="Use your offline changes, discard server changes"
                selected={selectedStrategy === 'keep_local'}
                onPress={() => setSelectedStrategy('keep_local')}
              />

              {/* Keep Remote */}
              <StrategyOption
                label="Keep Server Changes"
                description="Use server changes, discard your offline changes"
                selected={selectedStrategy === 'keep_remote'}
                onPress={() => setSelectedStrategy('keep_remote')}
              />

              {/* Manual Merge */}
              <StrategyOption
                label="Manually Select Fields"
                description="Choose which version to keep for each field"
                selected={selectedStrategy === 'merge_manual'}
                onPress={() => setSelectedStrategy('merge_manual')}
              />
            </View>

            {/* Field-by-field comparison */}
            {selectedStrategy === 'merge_manual' && (
              <View className="mb-6">
                <Text className="font-semibold text-foreground mb-3">Select Fields</Text>
                {conflict.fieldConflicts.map((fieldConflict) => (
                  <MobileFieldConflictRow
                    key={fieldConflict.fieldName}
                    fieldConflict={fieldConflict}
                    selected={fieldSelections[fieldConflict.fieldName] || 'local'}
                    onSelect={(version) => handleFieldSelection(fieldConflict.fieldName, version)}
                  />
                ))}
              </View>
            )}

            {/* Conflict Summary */}
            <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <Text className="text-sm text-blue-900 dark:text-blue-100">
                <Text className="font-semibold">{conflict.fieldConflicts.length}</Text> field
                {conflict.fieldConflicts.length !== 1 ? 's' : ''} have conflicting changes
              </Text>
            </View>

            {/* Conflict Details */}
            <View className="mb-6">
              <Text className="font-semibold text-foreground mb-3">Conflicting Fields</Text>
              {conflict.fieldConflicts.map((fieldConflict) => (
                <MobileConflictFieldDisplay key={fieldConflict.fieldName} fieldConflict={fieldConflict} />
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="border-t border-border p-4 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 rounded-lg border border-border items-center justify-center active:opacity-70"
            >
              <Text className="text-foreground font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleResolve}
              className="flex-1 py-3 rounded-lg bg-primary items-center justify-center active:opacity-70"
            >
              <Text className="text-white font-semibold">Resolve</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Strategy Option Component
 */
interface StrategyOptionProps {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

function StrategyOption({ label, description, selected, onPress }: StrategyOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-start gap-3 p-3 rounded-lg mb-2 border',
        selected ? 'bg-primary/10 border-primary' : 'border-border bg-surface'
      )}
    >
      <View
        className={cn(
          'w-5 h-5 rounded-full border-2 mt-1',
          selected ? 'border-primary bg-primary' : 'border-border'
        )}
      >
        {selected && <View className="flex-1 bg-white rounded-full m-1" />}
      </View>
      <View className="flex-1">
        <Text className="font-medium text-foreground">{label}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Mobile Field Conflict Row
 */
interface MobileFieldConflictRowProps {
  fieldConflict: FieldConflict;
  selected: 'local' | 'remote';
  onSelect: (version: 'local' | 'remote') => void;
}

function MobileFieldConflictRow({ fieldConflict, selected, onSelect }: MobileFieldConflictRowProps) {
  const localFormatted = ConflictDetector.formatValue(fieldConflict.localValue, fieldConflict.dataType);
  const remoteFormatted = ConflictDetector.formatValue(fieldConflict.remoteValue, fieldConflict.dataType);

  return (
    <View className="border border-border rounded-lg p-3 mb-3">
      <Text className="font-medium text-foreground mb-3">{fieldConflict.fieldLabel}</Text>
      <View className="gap-2">
        <FieldOption
          label="Your Changes"
          value={localFormatted}
          selected={selected === 'local'}
          onPress={() => onSelect('local')}
        />
        <FieldOption
          label="Server Changes"
          value={remoteFormatted}
          selected={selected === 'remote'}
          onPress={() => onSelect('remote')}
        />
      </View>
    </View>
  );
}

/**
 * Field Option Component
 */
interface FieldOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
}

function FieldOption({ label, value, selected, onPress }: FieldOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-start gap-2 p-2 rounded border',
        selected ? 'bg-primary/10 border-primary' : 'border-border bg-surface'
      )}
    >
      <View
        className={cn(
          'w-4 h-4 rounded border-2 mt-1',
          selected ? 'border-primary bg-primary' : 'border-border'
        )}
      />
      <View className="flex-1">
        <Text className="text-xs font-semibold text-muted">{label}</Text>
        <Text className="text-sm text-foreground mt-1">{value}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Mobile Conflict Field Display
 */
interface MobileConflictFieldDisplayProps {
  fieldConflict: FieldConflict;
}

function MobileConflictFieldDisplay({ fieldConflict }: MobileConflictFieldDisplayProps) {
  const localFormatted = ConflictDetector.formatValue(fieldConflict.localValue, fieldConflict.dataType);
  const remoteFormatted = ConflictDetector.formatValue(fieldConflict.remoteValue, fieldConflict.dataType);

  return (
    <View className="border border-border rounded-lg p-3 mb-3">
      <Text className="font-medium text-foreground text-sm mb-3">{fieldConflict.fieldLabel}</Text>
      <View className="gap-2">
        <View className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
          <Text className="font-semibold text-red-900 dark:text-red-100 text-xs mb-1">Your Changes</Text>
          <Text className="text-red-800 dark:text-red-200 text-xs">{localFormatted}</Text>
        </View>
        <View className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
          <Text className="font-semibold text-green-900 dark:text-green-100 text-xs mb-1">Server Changes</Text>
          <Text className="text-green-800 dark:text-green-200 text-xs">{remoteFormatted}</Text>
        </View>
      </View>
    </View>
  );
}
