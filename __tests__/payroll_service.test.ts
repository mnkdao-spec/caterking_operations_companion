import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase-client';
import { CateringDatabase } from '../shared/supabase-service';

describe('Payroll Service Operations', () => {
  let db: CateringDatabase;

  beforeEach(() => {
    db = new CateringDatabase(supabase!);
  });

  it('should create and retrieve a staff shift', async () => {
    // 1. Get a staff member first
    const { data: staff } = await supabase!.from('staff').select('id, hourly_rate').limit(1);
    if (!staff || staff.length === 0) {
      console.warn('No staff found, skipping test');
      return;
    }
    const staffId = staff[0].id;
    const rate = staff[0].hourly_rate || 20.00;

    // 2. Create Shift (starting 1.5 hours ago)
    const clockIn = new Date();
    clockIn.setMinutes(clockIn.getMinutes() - 90);

    const shiftData = {
      staff_id: staffId,
      hourly_rate: rate,
      clock_in: clockIn.toISOString(),
    };

    const shift = await db.createStaffShift(shiftData);
    expect(shift).toBeDefined();
    expect(shift.id).toBeDefined();
    expect(shift.staff_id).toBe(staffId);

    // 3. Update Shift (Clock out now)
    // Note: Trigger will calculate total_hours based on clock_in vs clock_out
    const updates = {
      clock_out: new Date().toISOString()
    };
    
    const updated = await db.updateStaffShift(shift.id, updates);
    expect(updated.clock_out).toBeDefined();
    
    // Calculation: 90 mins = 1.5 hours
    expect(parseFloat(updated.total_hours)).toBeCloseTo(1.5, 1);
    expect(parseFloat(updated.total_pay)).toBeCloseTo(rate * 1.5, 1);
  });
});