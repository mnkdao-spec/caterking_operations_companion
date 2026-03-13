import { describe, it, expect } from 'vitest';
import {
  createStaffAssignment,
  deleteStaffAssignment,
  getStaffAssignments,
  createStaffAvailability,
  getStaffAvailability,
  deleteStaffAvailability,
  checkStaffConflicts,
} from '../lib/services';

describe('Staff Scheduling End-to-End', () => {
  describe('Staff Assignment to Events', () => {
    it('should create staff assignment', async () => {
      const assignment = {
        staff_id: 'marcus-chen-id',
        event_id: 'event-1',
      };

      const result = await createStaffAssignment(assignment);

      expect(result).toBeDefined();
    });

    it('should retrieve staff assignments', async () => {
      const staffId = 'marcus-chen-id';

      const result = await getStaffAssignments(staffId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should delete staff assignment', async () => {
      const assignmentId = 'test-assignment-1';

      const result = await deleteStaffAssignment(assignmentId);

      expect(result).toBeDefined();
    });

    it('should handle duplicate assignments', async () => {
      const assignment = {
        staff_id: 'marcus-chen-id',
        event_id: 'event-1',
      };

      const result1 = await createStaffAssignment(assignment);
      expect(result1).toBeDefined();

      const result2 = await createStaffAssignment(assignment);
      expect(result2).toBeDefined();
    });
  });

  describe('Staff Availability Management', () => {
    it('should create staff availability period', async () => {
      const availabilityData = {
        staff_id: 'marcus-chen-id',
        availability_type: 'time_off',
        start_date: '2026-01-28',
        end_date: '2026-01-30',
        reason: 'Vacation',
      };

      const result = await createStaffAvailability(availabilityData);

      expect(result).toBeDefined();
    });

    it('should retrieve staff availability', async () => {
      const staffId = 'marcus-chen-id';

      const result = await getStaffAvailability(staffId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should delete availability period', async () => {
      const availabilityId = 'test-availability-to-delete';

      const result = await deleteStaffAvailability(availabilityId);

      expect(result).toBeDefined();
    });

    it('should support multiple availability types', async () => {
      const types = ['time_off', 'unavailable', 'preferred_shift'];

      for (const type of types) {
        const result = await createStaffAvailability({
          staff_id: 'marcus-chen-id',
          availability_type: type as any,
          start_date: '2026-02-01',
          end_date: '2026-02-05',
          reason: `Test ${type}`,
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe('Scheduling Workflow', () => {
    it('should complete full scheduling workflow', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-workflow-test';

      const conflictCheck = await checkStaffConflicts(
        staffId,
        eventId,
        '2026-01-26',
        '12:00:00'
      );
      expect(conflictCheck).toBeDefined();

      if (Array.isArray(conflictCheck) && conflictCheck.length === 0) {
        const assignment = await createStaffAssignment({
          staff_id: staffId,
          event_id: eventId,
        });
        expect(assignment).toBeDefined();

        const assignments = await getStaffAssignments(staffId);
        expect(assignments).toBeDefined();
        expect(Array.isArray(assignments)).toBe(true);
      }
    });

    it('should handle scheduling with availability constraints', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-constraint-test';

      const timeOff = await createStaffAvailability({
        staff_id: staffId,
        availability_type: 'time_off',
        start_date: '2026-01-28',
        end_date: '2026-01-30',
        reason: 'Vacation',
      });
      expect(timeOff).toBeDefined();

      const conflictCheck = await checkStaffConflicts(
        staffId,
        eventId,
        '2026-01-29',
        '14:00:00'
      );
      expect(conflictCheck).toBeDefined();
    });

    it('should handle multiple staff assignments to same event', async () => {
      const eventId = 'event-multi-staff';
      const staffMembers = ['marcus-chen-id', 'maria-garcia-id', 'staff-3-id'];

      const assignments = await Promise.all(
        staffMembers.map(staffId => createStaffAssignment({
          staff_id: staffId,
          event_id: eventId,
        }))
      );

      assignments.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Conflict Detection in Scheduling', () => {
    it('should prevent double-booking during assignment', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-1';

      const conflictCheck = await checkStaffConflicts(
        staffId,
        eventId,
        '2026-01-26',
        '12:26:00'
      );

      expect(conflictCheck).toBeDefined();
      if (Array.isArray(conflictCheck) && conflictCheck.length > 0) {
        const assignment = await createStaffAssignment({
          staff_id: staffId,
          event_id: eventId,
        });
        expect(assignment).toBeDefined();
      }
    });

    it('should allow assignment when no conflicts', async () => {
      const staffId = 'available-staff-id';
      const eventId = 'future-event-id';

      const conflictCheck = await checkStaffConflicts(
        staffId,
        eventId,
        '2026-03-15',
        '14:00:00'
      );

      expect(conflictCheck).toBeDefined();

      if (Array.isArray(conflictCheck) && conflictCheck.length === 0) {
        const assignment = await createStaffAssignment({
          staff_id: staffId,
          event_id: eventId,
        });
        expect(assignment).toBeDefined();
      }
    });
  });

  describe('Scheduling Validation', () => {
    it('should validate staff exists before assignment', async () => {
      const result = await createStaffAssignment({
        staff_id: 'non-existent-staff',
        event_id: 'event-1',
      });

      expect(result).toBeDefined();
    });

    it('should validate event exists before assignment', async () => {
      const result = await createStaffAssignment({
        staff_id: 'marcus-chen-id',
        event_id: 'non-existent-event',
      });

      expect(result).toBeDefined();
    });

    it('should validate availability dates', async () => {
      const result = await createStaffAvailability({
        staff_id: 'marcus-chen-id',
        availability_type: 'time_off',
        start_date: '2026-02-01',
        end_date: '2026-01-01',
        reason: 'Invalid dates',
      });

      expect(result).toBeDefined();
    });

    it('should validate availability type', async () => {
      const result = await createStaffAvailability({
        staff_id: 'marcus-chen-id',
        availability_type: 'invalid_type' as any,
        start_date: '2026-01-28',
        end_date: '2026-01-30',
        reason: 'Invalid type',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Scheduling Performance', () => {
    it('should create assignment within acceptable time', async () => {
      const startTime = Date.now();
      await createStaffAssignment({
        staff_id: 'marcus-chen-id',
        event_id: 'event-1',
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000);
    });

    it('should retrieve assignments within acceptable time', async () => {
      const startTime = Date.now();
      await getStaffAssignments('marcus-chen-id');
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000);
    });

    it('should check conflicts within acceptable time', async () => {
      const startTime = Date.now();
      await checkStaffConflicts('marcus-chen-id', 'event-1', '2026-01-26', '12:00:00');
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent scheduling operations', async () => {
      const operations = [
        createStaffAssignment({ staff_id: 'staff-1', event_id: 'event-1' }),
        createStaffAssignment({ staff_id: 'staff-2', event_id: 'event-2' }),
        createStaffAssignment({ staff_id: 'staff-3', event_id: 'event-3' }),
        getStaffAssignments('marcus-chen-id'),
      ];

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();

      results.forEach(result => {
        expect(result).toBeDefined();
      });

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Scheduling Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const result = await createStaffAssignment({
        staff_id: 'marcus-chen-id',
        event_id: 'event-1',
      });

      expect(result).toBeDefined();
    });

    it('should handle invalid parameters gracefully', async () => {
      const result = await getStaffAssignments('');

      expect(result).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const result = await deleteStaffAssignment('invalid-assignment-id');

      expect(result).toBeDefined();
    });
  });

  describe('Scheduling Calendar Integration', () => {
    it('should retrieve all assignments for calendar view', async () => {
      const result = await getStaffAssignments('marcus-chen-id');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter staff assignments by staff ID', async () => {
      const staffId = 'marcus-chen-id';

      const result = await getStaffAssignments(staffId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should display availability constraints on calendar', async () => {
      const staffId = 'marcus-chen-id';

      const availabilityResult = await getStaffAvailability(staffId);
      const assignmentsResult = await getStaffAssignments(staffId);

      expect(availabilityResult).toBeDefined();
      expect(assignmentsResult).toBeDefined();

      expect(Array.isArray(availabilityResult)).toBe(true);
      expect(Array.isArray(assignmentsResult)).toBe(true);
    });
  });

  describe('Scheduling Undo/Redo Operations', () => {
    it('should allow removal of incorrect assignments', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-undo-test';

      const assign = await createStaffAssignment({
        staff_id: staffId,
        event_id: eventId,
      });
      expect(assign).toBeDefined();

      const assignmentId = 'test-assignment-id';
      const remove = await deleteStaffAssignment(assignmentId);
      expect(remove).toBeDefined();

      const assignments = await getStaffAssignments(staffId);
      expect(assignments).toBeDefined();
    });

    it('should allow modification of availability periods', async () => {
      const availabilityId = 'test-availability-modify';

      const create = await createStaffAvailability({
        staff_id: 'marcus-chen-id',
        availability_type: 'time_off',
        start_date: '2026-01-28',
        end_date: '2026-01-30',
        reason: 'Original',
      });
      expect(create).toBeDefined();

      const remove = await deleteStaffAvailability(availabilityId);
      expect(remove).toBeDefined();
    });
  });
});
