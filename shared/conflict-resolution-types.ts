/**
 * Conflict Resolution Types
 * Data structures for detecting and resolving conflicts between offline and online changes
 */

/**
 * Represents a single field conflict
 */
export interface FieldConflict {
  fieldName: string;
  fieldLabel: string;
  localValue: any;
  remoteValue: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  lastModifiedLocal?: number;
  lastModifiedRemote?: number;
}

/**
 * Represents a full entity conflict
 */
export interface EntityConflict {
  id: string;
  entityType: 'event' | 'client' | 'staff' | 'menu' | 'invoice' | 'template';
  localVersion: Record<string, any>;
  remoteVersion: Record<string, any>;
  fieldConflicts: FieldConflict[];
  conflictDetectedAt: number;
  conflictId: string;
}

/**
 * Resolution strategy for conflicts
 */
export type ConflictResolutionStrategy = 
  | 'keep_local'      // Keep local changes, discard remote
  | 'keep_remote'     // Keep remote changes, discard local
  | 'merge_manual'    // Let user manually select fields
  | 'merge_auto'      // Automatically merge non-conflicting fields
  | 'last_write_wins' // Use timestamp to determine winner
  | 'custom';         // Custom resolution logic

/**
 * Result of conflict resolution
 */
export interface ConflictResolution {
  conflictId: string;
  entityId: string;
  entityType: string;
  strategy: ConflictResolutionStrategy;
  resolvedVersion: Record<string, any>;
  selectedFields?: Record<string, 'local' | 'remote'>; // For manual merge
  resolvedAt: number;
  resolvedBy?: string; // User ID who resolved
}

/**
 * Conflict resolution state for UI
 */
export interface ConflictResolutionState {
  conflicts: EntityConflict[];
  activeConflictId?: string;
  resolutions: Map<string, ConflictResolution>;
  isResolving: boolean;
  error?: Error;
}

/**
 * Diff information for displaying changes
 */
export interface FieldDiff {
  fieldName: string;
  fieldLabel: string;
  before: any;
  after: any;
  changeType: 'added' | 'removed' | 'modified';
  dataType: string;
}

/**
 * Change summary for an entity
 */
export interface EntityChangeSummary {
  entityId: string;
  entityType: string;
  changes: FieldDiff[];
  changedAt: number;
  changedBy?: string;
  changeCount: number;
}

/**
 * Conflict comparison result
 */
export interface ConflictComparison {
  hasConflicts: boolean;
  conflictingFields: string[];
  nonConflictingFields: string[];
  localOnlyFields: string[];
  remoteOnlyFields: string[];
  fieldConflicts: FieldConflict[];
}

/**
 * Merge strategy configuration
 */
export interface MergeStrategyConfig {
  strategy: ConflictResolutionStrategy;
  fieldPriority?: Record<string, 'local' | 'remote' | 'timestamp'>; // Per-field strategy
  timestampThreshold?: number; // How recent must timestamp be to win
  preserveLocalChanges?: boolean; // Keep local if no remote changes
  autoMergeNonConflicting?: boolean; // Merge fields that don't conflict
}

/**
 * Conflict event for listeners
 */
export interface ConflictEvent {
  type: 'conflict_detected' | 'conflict_resolved' | 'conflict_failed';
  conflict?: EntityConflict;
  resolution?: ConflictResolution;
  error?: Error;
  timestamp: number;
}

/**
 * Conflict statistics
 */
export interface ConflictStats {
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  conflictsByType: Record<string, number>;
  resolutionStrategies: Record<ConflictResolutionStrategy, number>;
  averageResolutionTime: number;
}
