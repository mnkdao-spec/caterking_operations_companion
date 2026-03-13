import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Procurement Storage Accessibility', () => {
  it('should be able to list files in purchase-orders bucket', async () => {
    // We don't expect any files yet, but it shouldn't return a 404/Not Found error
    const { data, error } = await supabase!.storage.from('purchase-orders').list();
    
    if (error) {
      console.error('Storage error:', error);
    }
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});