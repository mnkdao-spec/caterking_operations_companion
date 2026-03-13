import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Infrastructure Performance Baseline', () => {
  it('get_system_health RPC should respond under 200ms', async () => {
    const start = performance.now();
    const { error } = await supabase!.rpc('get_system_health');
    const end = performance.now();
    
    expect(error).toBeNull();
    const duration = end - start;
    console.log(`[Perf] get_system_health took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(200);
  });

  it('get_kds_efficiency_metrics RPC should respond under 200ms', async () => {
    const start = performance.now();
    const { error } = await supabase!.rpc('get_kds_efficiency_metrics');
    const end = performance.now();
    
    expect(error).toBeNull();
    const duration = end - start;
    console.log(`[Perf] get_kds_efficiency_metrics took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(200);
  });
});