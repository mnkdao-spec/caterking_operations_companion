import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Payroll Calculation Logic', () => {
  it('should calculate overtime pay correctly (1.5x after 8h)', async () => {
    // 1. Get a staff member
    const { data: staff } = await supabase!.from('staff').select('id').limit(1);
    const staffId = staff![0].id;
    const hourlyRate = 20.00;

    // 2. Create a shift starting 10 hours ago
    const clockIn = new Date();
    clockIn.setHours(clockIn.getHours() - 10);
    
    const { data: shift, error: createError } = await supabase!
      .from('staff_shifts')
      .insert({
        staff_id: staffId,
        hourly_rate: hourlyRate,
        clock_in: clockIn.toISOString()
      })
      .select()
      .single();

    expect(createError).toBeNull();

    // 3. Clock out now (10 hours total)
    const { data: updated, error: updateError } = await supabase!
      .from('staff_shifts')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', shift.id)
      .select()
      .single();

    expect(updateError).toBeNull();
    
    // Calculation: (8 * 20) + (2 * 20 * 1.5) = 160 + 60 = 220
    expect(parseFloat(updated.total_hours)).toBeCloseTo(10, 0);
    expect(parseFloat(updated.total_pay)).toBe(220);
  });
});
