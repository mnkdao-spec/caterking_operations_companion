/**
 * Conflict Resolution Manager
 * Manages conflict detection, storage, and resolution
 */

import {
  EntityConflict,
  ConflictResolution,
  ConflictResolutionStrategy,
  ConflictEvent,
  ConflictStats,
} from './conflict-resolution-types';
import { ConflictDetector } from './conflict-detector';
import { v4 as uuidv4 } from 'uuid';

type ConflictEventListener = (event: ConflictEvent) => void;

/**
 * Manages conflict detection and resolution
 */
export class ConflictResolutionManager {
  private conflicts: Map<string, EntityConflict> = new Map();
  private resolutions: Map<string, ConflictResolution> = new Map();
  private listeners: Set<ConflictEventListener> = new Set();
  private stats: ConflictStats = {
    totalConflicts: 0,
    resolvedConflicts: 0,
    pendingConflicts: 0,
    conflictsByType: {},
    resolutionStrategies: {},
    averageResolutionTime: 0,
  };

  /**
   * Register a conflict event listener
   */
  on(listener: ConflictEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit a conflict event
   */
  private emit(event: ConflictEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[ConflictResolutionManager] Error in listener:', error);
      }
    });
  }

  /**
   * Register a conflict
   */
  registerConflict(conflict: EntityConflict): void {
    this.conflicts.set(conflict.conflictId, conflict);

    // Update stats
    this.stats.totalConflicts++;
    this.stats.pendingConflicts++;
    this.stats.conflictsByType[conflict.entityType] =
      (this.stats.conflictsByType[conflict.entityType] || 0) + 1;

    // Emit event
    this.emit({
      type: 'conflict_detected',
      conflict,
      timestamp: Date.now(),
    });
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    selectedFields?: Record<string, 'local' | 'remote'>
  ): Promise<ConflictResolution> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    try {
      // Merge versions based on strategy
      let resolvedVersion: Record<string, any>;

      switch (strategy) {
        case 'keep_local':
          resolvedVersion = { ...conflict.localVersion };
          break;

        case 'keep_remote':
          resolvedVersion = { ...conflict.remoteVersion };
          break;

        case 'merge_manual':
          resolvedVersion = this.mergeWithFieldSelection(
            conflict.localVersion,
            conflict.remoteVersion,
            selectedFields || {}
          );
          break;

        case 'merge_auto':
          resolvedVersion = this.autoMerge(conflict.localVersion, conflict.remoteVersion);
          break;

        case 'last_write_wins':
          const newerVersion = ConflictDetector.getNewerVersion(
            conflict.fieldConflicts[0]?.lastModifiedLocal,
            conflict.fieldConflicts[0]?.lastModifiedRemote
          );
          resolvedVersion =
            newerVersion === 'local'
              ? { ...conflict.localVersion }
              : { ...conflict.remoteVersion };
          break;

        default:
          throw new Error(`Unknown resolution strategy: ${strategy}`);
      }

      // Create resolution record
      const resolution: ConflictResolution = {
        conflictId,
        entityId: conflict.id,
        entityType: conflict.entityType,
        strategy,
        resolvedVersion,
        selectedFields,
        resolvedAt: Date.now(),
      };

      // Store resolution
      this.resolutions.set(conflictId, resolution);

      // Update stats
      this.stats.resolvedConflicts++;
      this.stats.pendingConflicts--;
      this.stats.resolutionStrategies[strategy] =
        (this.stats.resolutionStrategies[strategy] || 0) + 1;

      // Emit event
      this.emit({
        type: 'conflict_resolved',
        resolution,
        timestamp: Date.now(),
      });

      return resolution;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.emit({
        type: 'conflict_failed',
        error: err,
        timestamp: Date.now(),
      });

      throw err;
    }
  }

  /**
   * Merge versions with field-level selection
   */
  private mergeWithFieldSelection(
    localVersion: Record<string, any>,
    remoteVersion: Record<string, any>,
    selectedFields: Record<string, 'local' | 'remote'>
  ): Record<string, any> {
    const merged = { ...remoteVersion };

    for (const [field, source] of Object.entries(selectedFields)) {
      if (source === 'local' && field in localVersion) {
        merged[field] = localVersion[field];
      } else if (source === 'remote' && field in remoteVersion) {
        merged[field] = remoteVersion[field];
      }
    }

    return merged;
  }

  /**
   * Automatically merge non-conflicting fields
   */
  private autoMerge(
    localVersion: Record<string, any>,
    remoteVersion: Record<string, any>
  ): Record<string, any> {
    const merged = { ...remoteVersion };

    for (const [key, value] of Object.entries(localVersion)) {
      if (!ConflictDetector.isMetadataField(key)) {
        if (!(key in remoteVersion)) {
          // Local-only field
          merged[key] = value;
        } else if (ConflictDetector.valuesEqual(value, remoteVersion[key])) {
          // Same value, keep either
          merged[key] = value;
        } else {
          // Conflicting field - prefer local (more recent)
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): EntityConflict[] {
    return Array.from(this.conflicts.values()).filter(
      (c) => !this.resolutions.has(c.conflictId)
    );
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): EntityConflict | undefined {
    return this.conflicts.get(conflictId);
  }

  /**
   * Get resolution by conflict ID
   */
  getResolution(conflictId: string): ConflictResolution | undefined {
    return this.resolutions.get(conflictId);
  }

  /**
   * Get all resolutions
   */
  getAllResolutions(): ConflictResolution[] {
    return Array.from(this.resolutions.values());
  }

  /**
   * Clear resolved conflicts
   */
  clearResolved(): void {
    const resolved = Array.from(this.conflicts.entries()).filter(
      ([conflictId]) => this.resolutions.has(conflictId)
    );

    resolved.forEach(([conflictId]) => {
      this.conflicts.delete(conflictId);
    });
  }

  /**
   * Get statistics
   */
  getStats(): ConflictStats {
    return {
      ...this.stats,
      pendingConflicts: this.getPendingConflicts().length,
    };
  }

  /**
   * Reset all conflicts and resolutions
   */
  reset(): void {
    this.conflicts.clear();
    this.resolutions.clear();
    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      pendingConflicts: 0,
      conflictsByType: {},
      resolutionStrategies: {},
      averageResolutionTime: 0,
    };
  }
}

// Global singleton instance
let instance: ConflictResolutionManager | null = null;

/**
 * Get or create the global conflict resolution manager
 */
export function getConflictResolutionManager(): ConflictResolutionManager {
  if (!instance) {
    instance = new ConflictResolutionManager();
  }
  return instance;
}
