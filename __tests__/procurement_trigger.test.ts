import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Automatic PO Drafting Trigger', () => {
  it('should draft a PO when stock is low', async () => {
    // 1. Get an ingredient and its supplier
    const { data: ingredients } = await supabase!
      .from('ingredients')
      .select('*, stock_levels(*)')
      .not('supplier', 'is', null)
      .limit(1);
    
    if (!ingredients || ingredients.length === 0) {
      console.warn('No ingredients with suppliers found, skipping test');
      return;
    }
    
    const ingredient = ingredients[0];
    
    // 2. Ensure stock is below reorder level
    await supabase!
      .from('stock_levels')
      .update({ quantity: ingredient.reorder_level - 1 })
      .eq('ingredient_id', ingredient.id);

    // 3. Run drafting function
    const { data, error } = await supabase!.rpc('draft_po_from_low_stock');
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    // 4. Verify PO exists
    const { data: pos } = await supabase!
      .from('purchase_orders')
      .select('*, po_items(*)')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1);
      
    expect(pos && pos.length > 0).toBe(true);
    const po = pos![0];
    const hasItem = po.po_items.some((i: any) => i.ingredient_id === ingredient.id);
    expect(hasItem).toBe(true);
  });
});
