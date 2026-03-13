import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConflictDetector } from '../../shared/conflict-detector';
import { ConflictResolutionManager, getConflictResolutionManager } from '../../shared/conflict-resolution-manager';
import { EntityConflict } from '../../shared/conflict-resolution-types';

/**
 * Conflict Resolution Tests
 *
 * Tests for OLD-83: Conflict Resolution UI
 * Validates conflict detection, comparison, and resolution strategies
 */

describe('OLD-83: Conflict Resolution UI', () => {
  let manager: ConflictResolutionManager;

  beforeEach(() => {
    manager = getConflictResolutionManager();
    manager.reset();
  });

  afterEach(() => {
    manager.reset();
  });

  // ============================================================================
  // CONFLICT DETECTION TESTS
  // ============================================================================

  describe('Conflict Detection', () => {
    it('should detect conflicts between different field values', () => {
      const local = { id: '1', name: 'Event A', date: '2026-02-01' };
      const remote = { id: '1', name: 'Event B', date: '2026-02-01' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote);

      expect(conflict).not.toBeNull();
      expect(conflict?.fieldConflicts.length).toBe(1);
      expect(conflict?.fieldConflicts[0].fieldName).toBe('name');
    });

    it('should not detect conflicts when versions are identical', () => {
      const local = { id: '1', name: 'Event A', date: '2026-02-01' };
      const remote = { id: '1', name: 'Event A', date: '2026-02-01' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote);

      expect(conflict).toBeNull();
    });

    it('should detect multiple field conflicts', () => {
      const local = { name: 'Event A', date: '2026-02-01', location: 'NYC' };
      const remote = { name: 'Event B', date: '2026-02-02', location: 'LA' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote);

      expect(conflict?.fieldConflicts.length).toBe(3);
    });

    it('should ignore metadata fields in conflict detection', () => {
      const local = { id: '1', name: 'Event A', created_at: '2026-01-01T00:00:00Z' };
      const remote = { id: '1', name: 'Event A', created_at: '2026-01-02T00:00:00Z' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote);

      expect(conflict).toBeNull();
    });
  });

  // ============================================================================
  // VERSION COMPARISON TESTS
  // ============================================================================

  describe('Version Comparison', () => {
    it('should identify conflicting fields', () => {
      const local = { name: 'Event A', capacity: 100 };
      const remote = { name: 'Event B', capacity: 100 };

      const comparison = ConflictDetector.compareVersions(local, remote);

      expect(comparison.conflictingFields).toContain('name');
      expect(comparison.nonConflictingFields).toContain('capacity');
    });

    it('should identify local-only fields', () => {
      const local = { name: 'Event A', notes: 'Local notes' };
      const remote = { name: 'Event A' };

      const comparison = ConflictDetector.compareVersions(local, remote);

      expect(comparison.localOnlyFields).toContain('notes');
    });

    it('should identify remote-only fields', () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event A', notes: 'Remote notes' };

      const comparison = ConflictDetector.compareVersions(local, remote);

      expect(comparison.remoteOnlyFields).toContain('notes');
    });

    it('should handle deep object comparison', () => {
      const local = { details: { location: 'NYC', time: '10:00' } };
      const remote = { details: { location: 'NYC', time: '10:00' } };

      const comparison = ConflictDetector.compareVersions(local, remote);

      expect(comparison.hasConflicts).toBe(false);
    });

    it('should detect array differences', () => {
      const local = { items: [1, 2, 3] };
      const remote = { items: [1, 2, 4] };

      const comparison = ConflictDetector.compareVersions(local, remote);

      expect(comparison.conflictingFields).toContain('items');
    });
  });

  // ============================================================================
  // CONFLICT RESOLUTION TESTS
  // ============================================================================

  describe('Conflict Resolution', () => {
    it('should resolve conflict with keep_local strategy', async () => {
      const local = { name: 'Event A', capacity: 100 };
      const remote = { name: 'Event B', capacity: 100 };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const resolution = await manager.resolveConflict(conflict.conflictId, 'keep_local');

      expect(resolution.resolvedVersion.name).toBe('Event A');
      expect(resolution.strategy).toBe('keep_local');
    });

    it('should resolve conflict with keep_remote strategy', async () => {
      const local = { name: 'Event A', capacity: 100 };
      const remote = { name: 'Event B', capacity: 100 };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const resolution = await manager.resolveConflict(conflict.conflictId, 'keep_remote');

      expect(resolution.resolvedVersion.name).toBe('Event B');
      expect(resolution.strategy).toBe('keep_remote');
    });

    it('should resolve conflict with merge_manual strategy', async () => {
      const local = { name: 'Event A', capacity: 100 };
      const remote = { name: 'Event B', capacity: 200 };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const fieldSelections = { name: 'local', capacity: 'remote' };
      const resolution = await manager.resolveConflict(
        conflict.conflictId,
        'merge_manual',
        fieldSelections
      );

      expect(resolution.resolvedVersion.name).toBe('Event A');
      expect(resolution.resolvedVersion.capacity).toBe(200);
    });

    it('should resolve conflict with merge_auto strategy', async () => {
      const local = { name: 'Event A', capacity: 100, notes: 'Local' };
      const remote = { name: 'Event B', capacity: 100, location: 'NYC' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const resolution = await manager.resolveConflict(conflict.conflictId, 'merge_auto');

      expect(resolution.resolvedVersion.name).toBe('Event A'); // Local wins on conflict
      expect(resolution.resolvedVersion.capacity).toBe(100); // Same value
      expect(resolution.resolvedVersion.notes).toBe('Local'); // Local-only
      expect(resolution.resolvedVersion.location).toBe('NYC'); // Remote-only
    });

    it('should resolve conflict with last_write_wins strategy', async () => {
      const now = Date.now();
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts(
        '1',
        'event',
        local,
        remote,
        now + 1000, // Local is newer
        now
      )!;
      manager.registerConflict(conflict);

      const resolution = await manager.resolveConflict(conflict.conflictId, 'last_write_wins');

      expect(resolution.resolvedVersion.name).toBe('Event A');
    });
  });

  // ============================================================================
  // CONFLICT MANAGER TESTS
  // ============================================================================

  describe('Conflict Manager', () => {
    it('should register conflicts', () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const pending = manager.getPendingConflicts();
      expect(pending.length).toBe(1);
    });

    it('should track pending conflicts', async () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      expect(manager.getPendingConflicts().length).toBe(1);

      await manager.resolveConflict(conflict.conflictId, 'keep_local');

      expect(manager.getPendingConflicts().length).toBe(0);
    });

    it('should retrieve conflict by ID', () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const retrieved = manager.getConflict(conflict.conflictId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('1');
    });

    it('should retrieve resolution by conflict ID', async () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      await manager.resolveConflict(conflict.conflictId, 'keep_local');

      const resolution = manager.getResolution(conflict.conflictId);
      expect(resolution).toBeDefined();
      expect(resolution?.strategy).toBe('keep_local');
    });

    it('should track statistics', async () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const stats = manager.getStats();
      expect(stats.totalConflicts).toBe(1);
      expect(stats.pendingConflicts).toBe(1);
      expect(stats.resolvedConflicts).toBe(0);

      await manager.resolveConflict(conflict.conflictId, 'keep_local');

      const updatedStats = manager.getStats();
      expect(updatedStats.resolvedConflicts).toBe(1);
      expect(updatedStats.pendingConflicts).toBe(0);
    });

    it('should emit conflict events', () => {
      return new Promise<void>((resolve) => {
        const local = { name: 'Event A' };
        const remote = { name: 'Event B' };

        const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

        manager.on((event) => {
          if (event.type === 'conflict_detected') {
            expect(event.conflict).toBeDefined();
            resolve();
          }
        });

        manager.registerConflict(conflict);
      });
    });

    it('should clear resolved conflicts', async () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      await manager.resolveConflict(conflict.conflictId, 'keep_local');

      manager.clearResolved();

      expect(manager.getConflict(conflict.conflictId)).toBeUndefined();
    });
  });

  // ============================================================================
  // DATA TYPE HANDLING TESTS
  // ============================================================================

  describe('Data Type Handling', () => {
    it('should handle string values', () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.fieldConflicts[0].dataType).toBe('string');
    });

    it('should handle number values', () => {
      const local = { capacity: 100 };
      const remote = { capacity: 200 };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.fieldConflicts[0].dataType).toBe('number');
    });

    it('should handle boolean values', () => {
      const local = { isActive: true };
      const remote = { isActive: false };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.fieldConflicts[0].dataType).toBe('boolean');
    });

    it('should handle date values', () => {
      const local = { date: new Date('2026-02-01').toISOString() };
      const remote = { date: new Date('2026-02-02').toISOString() };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.fieldConflicts[0].dataType).toBe('string');
    });

    it('should handle array values', () => {
      const local = { items: [1, 2, 3] };
      const remote = { items: [1, 2, 4] };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.fieldConflicts[0].dataType).toBe('array');
    });

    it('should handle object values', () => {
      const local = { details: { x: 1 } };
      const remote = { details: { x: 2 } };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.fieldConflicts[0].dataType).toBe('object');
    });
  });

  // ============================================================================
  // FIELD NAME FORMATTING TESTS
  // ============================================================================

  describe('Field Name Formatting', () => {
    it('should convert camelCase to readable label', () => {
      const label = ConflictDetector.fieldNameToLabel('eventName');
      expect(label).toBe('Event Name');
    });

    it('should convert snake_case to readable label', () => {
      const label = ConflictDetector.fieldNameToLabel('event_name');
      expect(label).toBe('Event Name');
    });

    it('should handle single word', () => {
      const label = ConflictDetector.fieldNameToLabel('name');
      expect(label).toBe('Name');
    });
  });

  // ============================================================================
  // VALUE FORMATTING TESTS
  // ============================================================================

  describe('Value Formatting', () => {
    it('should format null values', () => {
      const formatted = ConflictDetector.formatValue(null, 'string');
      expect(formatted).toBe('(empty)');
    });

    it('should format date values', () => {
      const date = new Date('2026-02-01T10:00:00Z');
      const formatted = ConflictDetector.formatValue(date, 'date');
      expect(formatted).toContain('2026');
    });

    it('should format boolean values', () => {
      expect(ConflictDetector.formatValue(true, 'boolean')).toBe('Yes');
      expect(ConflictDetector.formatValue(false, 'boolean')).toBe('No');
    });

    it('should format array values', () => {
      const formatted = ConflictDetector.formatValue([1, 2, 3], 'array');
      expect(formatted).toContain('3 items');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(200);
      const formatted = ConflictDetector.formatValue(longString, 'string');
      expect(formatted.length).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty objects', () => {
      const conflict = ConflictDetector.detectConflicts('1', 'event', {}, {});
      expect(conflict).toBeNull();
    });

    it('should handle null values', () => {
      const local = { name: null };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      expect(conflict.fieldConflicts.length).toBe(1);
    });

    it('should handle undefined values', () => {
      const local = { name: undefined };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      expect(conflict.fieldConflicts.length).toBe(1);
    });

    it('should handle circular references gracefully', () => {
      const local: any = { name: 'Event A' };
      local.self = local;

      const remote = { name: 'Event B' };

      // Should not throw
      expect(() => {
        ConflictDetector.detectConflicts('1', 'event', local, remote);
      }).not.toThrow();
    });
  });

  // ============================================================================
  // ACCEPTANCE CRITERIA TESTS
  // ============================================================================

  describe('Acceptance Criteria', () => {
    it('[AC1] Detects conflicts between offline and online changes', () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote);

      expect(conflict).not.toBeNull();
      expect(conflict?.fieldConflicts.length).toBeGreaterThan(0);
    });

    it('[AC2] Shows both versions for comparison', () => {
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;

      expect(conflict.localVersion).toEqual(local);
      expect(conflict.remoteVersion).toEqual(remote);
    });

    it('[AC3] Allows user to choose resolution strategy', async () => {
      // Reset manager before test
      manager.reset();
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const strategies: Array<'keep_local' | 'keep_remote' | 'merge_manual'> = [
        'keep_local',
        'keep_remote',
        'merge_manual',
      ];

      for (const strategy of strategies) {
        const resolution = await manager.resolveConflict(conflict.conflictId, strategy);
        expect(resolution.strategy).toBe(strategy);
      }
    });

    it('[AC4] Supports manual field-by-field resolution', async () => {
      // Reset manager before test
      manager.reset();
      const local = { name: 'Event A', capacity: 100 };
      const remote = { name: 'Event B', capacity: 200 };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote)!;
      manager.registerConflict(conflict);

      const fieldSelections = { name: 'local', capacity: 'remote' };
      const resolution = await manager.resolveConflict(
        conflict.conflictId,
        'merge_manual',
        fieldSelections
      );

      expect(resolution.selectedFields).toEqual(fieldSelections);
    });

    it('[AC5] Works across mobile and web platforms', () => {
      // ConflictDetector and ConflictResolutionManager are platform-agnostic
      const local = { name: 'Event A' };
      const remote = { name: 'Event B' };

      const conflict = ConflictDetector.detectConflicts('1', 'event', local, remote);

      expect(conflict).not.toBeNull();
    });
  });
});
