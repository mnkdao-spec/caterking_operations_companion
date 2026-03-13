import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Payroll Schema Existence', () => {
  it('should have staff_shifts table', async () => {
    const { error } = await supabase!
      .from('staff_shifts')
      .select('id')
      .limit(1);
    
    // Initial failure expected
    expect(error).toBeNull();
  });
});
