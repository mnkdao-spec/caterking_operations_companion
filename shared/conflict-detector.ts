/**
 * Conflict Detector Service
 * Detects and compares conflicts between local and remote versions
 */

import {
  EntityConflict,
  FieldConflict,
  ConflictComparison,
  FieldDiff,
  EntityChangeSummary,
} from './conflict-resolution-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detects conflicts between two versions of an entity
 */
export class ConflictDetector {
  /**
   * Compare local and remote versions and detect conflicts
   */
  static detectConflicts(
    entityId: string,
    entityType: string,
    localVersion: Record<string, any>,
    remoteVersion: Record<string, any>,
    localTimestamp?: number,
    remoteTimestamp?: number
  ): EntityConflict | null {
    const comparison = this.compareVersions(
      localVersion,
      remoteVersion,
      localTimestamp,
      remoteTimestamp
    );

    if (!comparison.hasConflicts) {
      return null;
    }

    return {
      id: entityId,
      entityType: entityType as any,
      localVersion,
      remoteVersion,
      fieldConflicts: comparison.fieldConflicts,
      conflictDetectedAt: Date.now(),
      conflictId: uuidv4(),
    };
  }

  /**
   * Compare two versions and identify conflicts
   */
  static compareVersions(
    localVersion: Record<string, any>,
    remoteVersion: Record<string, any>,
    localTimestamp?: number,
    remoteTimestamp?: number
  ): ConflictComparison {
    const fieldConflicts: FieldConflict[] = [];
    const conflictingFields: string[] = [];
    const nonConflictingFields: string[] = [];
    const localOnlyFields: string[] = [];
    const remoteOnlyFields: string[] = [];

    // Get all field names from both versions
    const allFields = new Set([
      ...Object.keys(localVersion),
      ...Object.keys(remoteVersion),
    ]);

    // Compare each field
    for (const field of allFields) {
      // Skip metadata fields
      if (this.isMetadataField(field)) {
        continue;
      }

      const localValue = localVersion[field];
      const remoteValue = remoteVersion[field];

      if (!(field in localVersion)) {
        remoteOnlyFields.push(field);
      } else if (!(field in remoteVersion)) {
        localOnlyFields.push(field);
      } else if (!this.valuesEqual(localValue, remoteValue)) {
        // Values differ - this is a conflict
        conflictingFields.push(field);
        fieldConflicts.push({
          fieldName: field,
          fieldLabel: this.fieldNameToLabel(field),
          localValue,
          remoteValue,
          dataType: this.getDataType(localValue),
          lastModifiedLocal: localTimestamp,
          lastModifiedRemote: remoteTimestamp,
        });
      } else {
        // Values are the same
        nonConflictingFields.push(field);
      }
    }

    return {
      hasConflicts: conflictingFields.length > 0,
      conflictingFields,
      nonConflictingFields,
      localOnlyFields,
      remoteOnlyFields,
      fieldConflicts,
    };
  }

  /**
   * Check if two values are equal (deep comparison)
   */
  static valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;

    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => this.valuesEqual(item, b[index]));
      }

      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);

      if (aKeys.length !== bKeys.length) return false;

      return aKeys.every((key) => this.valuesEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Get the data type of a value
   */
  static getDataType(
    value: any
  ): 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  /**
   * Convert field name to human-readable label
   */
  static fieldNameToLabel(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  /**
   * Check if field is metadata (should be ignored in comparisons)
   */
  static isMetadataField(fieldName: string): boolean {
    const metadataFields = [
      'id',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by',
      'version',
      '_version',
      'timestamp',
      '_timestamp',
    ];
    return metadataFields.includes(fieldName.toLowerCase());
  }

  /**
   * Calculate diff between two versions
   */
  static calculateDiff(
    before: Record<string, any>,
    after: Record<string, any>
  ): FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const allFields = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const field of allFields) {
      if (this.isMetadataField(field)) continue;

      const beforeValue = before[field];
      const afterValue = after[field];

      if (!(field in before)) {
        diffs.push({
          fieldName: field,
          fieldLabel: this.fieldNameToLabel(field),
          before: undefined,
          after: afterValue,
          changeType: 'added',
          dataType: this.getDataType(afterValue),
        });
      } else if (!(field in after)) {
        diffs.push({
          fieldName: field,
          fieldLabel: this.fieldNameToLabel(field),
          before: beforeValue,
          after: undefined,
          changeType: 'removed',
          dataType: this.getDataType(beforeValue),
        });
      } else if (!this.valuesEqual(beforeValue, afterValue)) {
        diffs.push({
          fieldName: field,
          fieldLabel: this.fieldNameToLabel(field),
          before: beforeValue,
          after: afterValue,
          changeType: 'modified',
          dataType: this.getDataType(afterValue),
        });
      }
    }

    return diffs;
  }

  /**
   * Generate change summary for an entity
   */
  static generateChangeSummary(
    entityId: string,
    entityType: string,
    before: Record<string, any>,
    after: Record<string, any>,
    changedAt: number,
    changedBy?: string
  ): EntityChangeSummary {
    const changes = this.calculateDiff(before, after);

    return {
      entityId,
      entityType,
      changes,
      changedAt,
      changedBy,
      changeCount: changes.length,
    };
  }

  /**
   * Format value for display
   */
  static formatValue(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return '(empty)';
    }

    switch (dataType) {
      case 'date':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'array':
        return `[${Array.isArray(value) ? value.length : 0} items]`;
      case 'object':
        return '[object]';
      case 'number':
        return value.toString();
      case 'string':
      default:
        return value.toString().substring(0, 100);
    }
  }

  /**
   * Detect which version is newer based on timestamps
   */
  static getNewerVersion(
    localTimestamp: number | undefined,
    remoteTimestamp: number | undefined
  ): 'local' | 'remote' | 'unknown' {
    if (!localTimestamp || !remoteTimestamp) {
      return 'unknown';
    }

    if (localTimestamp > remoteTimestamp) {
      return 'local';
    } else if (remoteTimestamp > localTimestamp) {
      return 'remote';
    }

    return 'unknown';
  }

  /**
   * Merge two versions using a strategy
   */
  static mergeVersions(
    localVersion: Record<string, any>,
    remoteVersion: Record<string, any>,
    strategy: 'local' | 'remote' | 'merge',
    fieldPriority?: Record<string, 'local' | 'remote'>
  ): Record<string, any> {
    if (strategy === 'local') {
      return { ...localVersion };
    }

    if (strategy === 'remote') {
      return { ...remoteVersion };
    }

    // Merge strategy: combine both versions
    const merged = { ...remoteVersion };

    for (const [key, value] of Object.entries(localVersion)) {
      if (this.isMetadataField(key)) {
        continue;
      }

      if (fieldPriority && key in fieldPriority) {
        if (fieldPriority[key] === 'local') {
          merged[key] = value;
        }
        // else keep remote value
      } else {
        // If field exists in both, prefer local (more recent)
        if (key in remoteVersion) {
          merged[key] = value;
        } else {
          merged[key] = value;
        }
      }
    }

    return merged;
  }
}
