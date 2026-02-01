'use client';

import { useState } from 'react';
import { EntityConflict, FieldConflict, ConflictResolutionStrategy } from '@/shared/conflict-resolution-types';
import { ConflictDetector } from '@/shared/conflict-detector';
import { cn } from '@/lib/utils';

interface ConflictResolutionDialogProps {
  conflict: EntityConflict;
  isOpen: boolean;
  onResolve: (strategy: ConflictResolutionStrategy, selectedFields?: Record<string, 'local' | 'remote'>) => void;
  onCancel: () => void;
}

/**
 * Conflict Resolution Dialog Component
 *
 * Displays conflicts between local and remote versions with options to:
 * - Keep local changes
 * - Keep remote changes
 * - Manually select which version to keep for each field
 *
 * Usage:
 * ```tsx
 * <ConflictResolutionDialog
 *   conflict={conflict}
 *   isOpen={true}
 *   onResolve={(strategy) => handleResolve(strategy)}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
export function ConflictResolutionDialog({
  conflict,
  isOpen,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy>('keep_local');
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'local' | 'remote'>>({});

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border p-6">
          <h2 className="text-2xl font-bold text-foreground">Resolve Conflict</h2>
          <p className="text-sm text-muted mt-1">
            This {conflict.entityType} was modified both offline and online. Choose how to resolve.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Strategy Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Resolution Strategy</h3>

            {/* Keep Local */}
            <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface/50 transition-colors">
              <input
                type="radio"
                name="strategy"
                value="keep_local"
                checked={selectedStrategy === 'keep_local'}
                onChange={(e) => setSelectedStrategy(e.target.value as ConflictResolutionStrategy)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-foreground">Keep Local Changes</p>
                <p className="text-sm text-muted">Use your offline changes, discard server changes</p>
              </div>
            </label>

            {/* Keep Remote */}
            <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface/50 transition-colors">
              <input
                type="radio"
                name="strategy"
                value="keep_remote"
                checked={selectedStrategy === 'keep_remote'}
                onChange={(e) => setSelectedStrategy(e.target.value as ConflictResolutionStrategy)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-foreground">Keep Server Changes</p>
                <p className="text-sm text-muted">Use server changes, discard your offline changes</p>
              </div>
            </label>

            {/* Manual Merge */}
            <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface/50 transition-colors">
              <input
                type="radio"
                name="strategy"
                value="merge_manual"
                checked={selectedStrategy === 'merge_manual'}
                onChange={(e) => setSelectedStrategy(e.target.value as ConflictResolutionStrategy)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-foreground">Manually Select Fields</p>
                <p className="text-sm text-muted">Choose which version to keep for each field</p>
              </div>
            </label>
          </div>

          {/* Field-by-field comparison (shown when manual merge selected) */}
          {selectedStrategy === 'merge_manual' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Select Fields</h3>
              <div className="space-y-2">
                {conflict.fieldConflicts.map((fieldConflict) => (
                  <FieldConflictRow
                    key={fieldConflict.fieldName}
                    fieldConflict={fieldConflict}
                    selected={fieldSelections[fieldConflict.fieldName] || 'local'}
                    onSelect={(version) => handleFieldSelection(fieldConflict.fieldName, version)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conflict Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">{conflict.fieldConflicts.length}</span> field
              {conflict.fieldConflicts.length !== 1 ? 's' : ''} have conflicting changes
            </p>
          </div>

          {/* Conflict Details */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Conflicting Fields</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {conflict.fieldConflicts.map((fieldConflict) => (
                <ConflictFieldDisplay key={fieldConflict.fieldName} fieldConflict={fieldConflict} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
          >
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Field Conflict Row Component
 */
interface FieldConflictRowProps {
  fieldConflict: FieldConflict;
  selected: 'local' | 'remote';
  onSelect: (version: 'local' | 'remote') => void;
}

function FieldConflictRow({ fieldConflict, selected, onSelect }: FieldConflictRowProps) {
  const localFormatted = ConflictDetector.formatValue(fieldConflict.localValue, fieldConflict.dataType);
  const remoteFormatted = ConflictDetector.formatValue(fieldConflict.remoteValue, fieldConflict.dataType);

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <p className="font-medium text-foreground">{fieldConflict.fieldLabel}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-start gap-2 p-2 border border-border rounded cursor-pointer hover:bg-surface/50 transition-colors">
          <input
            type="radio"
            name={`field_${fieldConflict.fieldName}`}
            value="local"
            checked={selected === 'local'}
            onChange={() => onSelect('local')}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted mb-1">Your Changes</p>
            <p className="text-sm text-foreground break-words">{localFormatted}</p>
          </div>
        </label>

        <label className="flex items-start gap-2 p-2 border border-border rounded cursor-pointer hover:bg-surface/50 transition-colors">
          <input
            type="radio"
            name={`field_${fieldConflict.fieldName}`}
            value="remote"
            checked={selected === 'remote'}
            onChange={() => onSelect('remote')}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted mb-1">Server Changes</p>
            <p className="text-sm text-foreground break-words">{remoteFormatted}</p>
          </div>
        </label>
      </div>
    </div>
  );
}

/**
 * Conflict Field Display Component
 */
interface ConflictFieldDisplayProps {
  fieldConflict: FieldConflict;
}

function ConflictFieldDisplay({ fieldConflict }: ConflictFieldDisplayProps) {
  const localFormatted = ConflictDetector.formatValue(fieldConflict.localValue, fieldConflict.dataType);
  const remoteFormatted = ConflictDetector.formatValue(fieldConflict.remoteValue, fieldConflict.dataType);

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <p className="font-medium text-foreground text-sm">{fieldConflict.fieldLabel}</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
          <p className="font-semibold text-red-900 dark:text-red-100 mb-1">Your Changes</p>
          <p className="text-red-800 dark:text-red-200 break-words">{localFormatted}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
          <p className="font-semibold text-green-900 dark:text-green-100 mb-1">Server Changes</p>
          <p className="text-green-800 dark:text-green-200 break-words">{remoteFormatted}</p>
        </div>
      </div>
    </div>
  );
}
