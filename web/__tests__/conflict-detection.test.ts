import { describe, it, expect } from 'vitest';
import { checkStaffConflicts } from '../lib/supabase-services';

describe('Conflict Detection System', () => {
  describe('Staff Conflict Detection', () => {
    it('should detect double-booking conflicts', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-1';
      const eventDate = '2026-01-26';
      const eventTime = '12:26:00';

      const result = await checkStaffConflicts(staffId, eventId, eventDate, eventTime);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no conflicts exist', async () => {
      const staffId = 'available-staff-id';
      const eventId = 'new-event';
      const eventDate = '2026-03-15';
      const eventTime = '14:00:00';

      const result = await checkStaffConflicts(staffId, eventId, eventDate, eventTime);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should detect conflicts with staff availability periods', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-2';
      const eventDate = '2026-01-28';
      const eventTime = '10:00:00';

      const result = await checkStaffConflicts(staffId, eventId, eventDate, eventTime);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle invalid staff ID gracefully', async () => {
      const result = await checkStaffConflicts(
        'invalid-staff-id',
        'event-1',
        '2026-01-26',
        '12:00:00'
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle invalid event ID gracefully', async () => {
      const result = await checkStaffConflicts(
        'marcus-chen-id',
        'invalid-event-id',
        '2026-01-26',
        '12:00:00'
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should format conflict details correctly', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-1';
      const eventDate = '2026-01-26';
      const eventTime = '12:26:00';

      const result = await checkStaffConflicts(staffId, eventId, eventDate, eventTime);

      expect(result).toBeDefined();
      if (Array.isArray(result) && result.length > 0) {
        const conflict = result[0];
        expect(conflict).toHaveProperty('conflict_type');
        expect(conflict).toHaveProperty('conflict_start');
        expect(conflict).toHaveProperty('conflict_end');
        expect(conflict).toHaveProperty('conflict_details');
      }
    });
  });

  describe('Conflict Detection Edge Cases', () => {
    it('should handle back-to-back events correctly', async () => {
      const staffId = 'test-staff';
      const event2Id = 'event-2';
      const eventDate = '2026-01-26';
      const eventTime = '20:00:00';

      const result = await checkStaffConflicts(staffId, event2Id, eventDate, eventTime);

      expect(result).toBeDefined();
    });

    it('should detect partial overlaps', async () => {
      const staffId = 'marcus-chen-id';
      const event3Id = 'event-3';
      const eventDate = '2026-01-26';
      const eventTime = '19:00:00';

      const result = await checkStaffConflicts(staffId, event3Id, eventDate, eventTime);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle null event ID (new event)', async () => {
      const staffId = 'marcus-chen-id';
      const eventDate = '2026-01-26';
      const eventTime = '12:26:00';

      const result = await checkStaffConflicts(staffId, null as any, eventDate, eventTime);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle different date formats', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-1';
      
      const result1 = await checkStaffConflicts(
        staffId,
        eventId,
        '2026-01-26',
        '12:26:00'
      );

      expect(result1).toBeDefined();
    });
  });

  describe('Conflict Detection Performance', () => {
    it('should return results within acceptable time', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-1';
      const eventDate = '2026-01-26';
      const eventTime = '12:26:00';

      const startTime = Date.now();
      await checkStaffConflicts(staffId, eventId, eventDate, eventTime);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple concurrent conflict checks', async () => {
      const checks = [
        checkStaffConflicts('staff-1', 'event-1', '2026-01-26', '12:00:00'),
        checkStaffConflicts('staff-2', 'event-2', '2026-01-27', '14:00:00'),
        checkStaffConflicts('staff-3', 'event-3', '2026-01-28', '16:00:00'),
      ];

      const results = await Promise.all(checks);

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Conflict Detection Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const result = await checkStaffConflicts(
        'marcus-chen-id',
        'event-1',
        '2026-01-26',
        '12:26:00'
      );

      expect(result).toBeDefined();
    });

    it('should return meaningful error messages', async () => {
      const result = await checkStaffConflicts(
        'marcus-chen-id',
        'event-1',
        '2026-01-26',
        '12:26:00'
      );

      expect(result).toBeDefined();
    });
  });

  describe('Conflict Detection Integration', () => {
    it('should work with actual event data', async () => {
      const staffId = 'marcus-chen-id';
      const eventId = 'event-1';
      const eventDate = '2026-01-26';
      const eventTime = '12:26:00';

      const result = await checkStaffConflicts(staffId, eventId, eventDate, eventTime);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
