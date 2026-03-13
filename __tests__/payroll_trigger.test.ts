import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Payroll Background Triggers', () => {
  it('should update event labor_costs_actual when a shift is completed', async () => {
    // 1. Get an event and staff member
    const { data: events } = await supabase!.from('events').select('id').limit(1);
    const { data: staff } = await supabase!.from('staff').select('id').limit(1);
    
    const eventId = events![0].id;
    const staffId = staff![0].id;

    // 2. Create a shift for this event
    const { data: shift } = await supabase!
      .from('staff_shifts')
      .insert({
        staff_id: staffId,
        event_id: eventId,
        hourly_rate: 100.00,
        clock_in: new Date().toISOString()
      })
      .select()
      .single();

    // 3. Complete the shift
    // Note: The tr_calculate_shift_pay trigger will set total_pay to 100.00 (1h minimum)
    const { error: updateError } = await supabase!
      .from('staff_shifts')
      .update({ 
        clock_out: new Date().toISOString()
      })
      .eq('id', shift.id);

    expect(updateError).toBeNull();

    // 4. Verify Event cost updated (with small delay for trigger execution)
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: event } = await supabase!
      .from('events')
      .select('labor_costs_actual')
      .eq('id', eventId)
      .single();

    // Sum of all shifts for this event might be higher than 100 if previous tests left data
    expect(event).not.toBeNull();
    expect(parseFloat(event!.labor_costs_actual)).toBeGreaterThanOrEqual(100.00);
  });
});
