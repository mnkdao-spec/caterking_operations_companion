import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase-client';
import { CateringDatabase } from '../shared/supabase-service';

describe('Procurement Service Operations', () => {
  let db: CateringDatabase;

  beforeEach(() => {
    db = new CateringDatabase(supabase!);
  });

  it('should create and retrieve a purchase order', async () => {
    // 1. Get a supplier first
    const { data: suppliers } = await supabase!.from('suppliers').select('id').limit(1);
    if (!suppliers || suppliers.length === 0) {
      console.warn('No suppliers found, skipping test');
      return;
    }
    const supplierId = suppliers[0].id;

    // 2. Create PO
    const poData = {
      supplier_id: supplierId,
      status: 'draft' as const,
      total_amount: 150.50,
    };

    const po = await db.createPurchaseOrder(poData);
    expect(po).toBeDefined();
    expect(po.id).toBeDefined();
    expect(po.supplier_id).toBe(supplierId);

    // 3. Get PO
    const retrievedPo = await db.getPurchaseOrderById(po.id);
    expect(retrievedPo).toBeDefined();
    expect(retrievedPo.id).toBe(po.id);
    expect(retrievedPo.suppliers).toBeDefined();
  });

  it('should create and retrieve PO items', async () => {
    // 1. Get a supplier and an ingredient
    const { data: suppliers } = await supabase!.from('suppliers').select('id').limit(1);
    const { data: ingredients } = await supabase!.from('ingredients').select('id').limit(1);
    
    if (!suppliers || suppliers.length === 0 || !ingredients || ingredients.length === 0) {
      console.warn('No suppliers or ingredients found, skipping test');
      return;
    }
    
    const supplierId = suppliers[0].id;
    const ingredientId = ingredients[0].id;

    // 2. Create PO
    const po = await db.createPurchaseOrder({
      supplier_id: supplierId,
      status: 'draft',
      total_amount: 100.00,
    });

    // 3. Create PO Item
    const itemData = {
      po_id: po.id,
      ingredient_id: ingredientId,
      description: 'Test Ingredient',
      quantity_ordered: 10,
      quantity_received: 0,
      unit_price: 10.00,
      surge_threshold_percent: 10.00,
    };

    const item = await db.createPOItem(itemData);
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.po_id).toBe(po.id);

    // 4. Get items
    const items = await db.getPOItems(po.id);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].id).toBe(item.id);
  });
});