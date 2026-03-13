import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Procurement Schema Existence', () => {
  it('should have purchase_orders table', async () => {
    const { error } = await supabase!
      .from('purchase_orders')
      .select('id')
      .limit(1);
    
    // If table doesn't exist, Supabase returns a specific error code
    // We expect this to fail initially
    expect(error).toBeNull();
  });

  it('should have po_items table', async () => {
    const { error } = await supabase!
      .from('po_items')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });

  it('should have ocr_audit_logs table', async () => {
    const { error } = await supabase!
      .from('ocr_audit_logs')
      .select('id')
      .limit(1);
    
    expect(error).toBeNull();
  });
});
