import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('Atomic Inventory Bumping', () => {
  it('should decrement stock according to recipe when item is bumped', async () => {
    // 1. Setup: Get a menu item and ingredient
    const { data: menuItems } = await supabase!.from('menu_items').select('id').limit(1);
    const { data: ingredients } = await supabase!.from('ingredients').select('id').limit(1);
    
    if (!menuItems?.length || !ingredients?.length) {
      console.warn('Insufficient data for inventory bump test');
      return;
    }

    const menuItemId = menuItems[0].id;
    const ingredientId = ingredients[0].id;

    // 2. Create Recipe: 1 Dish uses 5 units of Ingredient
    await supabase!
      .from('menu_item_ingredients')
      .upsert({ 
        menu_item_id: menuItemId, 
        ingredient_id: ingredientId, 
        quantity_required: 5.0 
      });

    // 3. Set Initial Stock: 100 units
    await supabase!
      .from('stock_levels')
      .upsert({ ingredient_id: ingredientId, quantity: 100.0 });

    // 4. Create Order Item
    const { data: course } = await supabase!
      .from('fired_courses')
      .insert({ event_id: 'e5510234-fc69-4b13-8540-c2c0f44a45c6', course_name: 'Test' })
      .select().single();

    const { data: orderItem } = await supabase!
      .from('order_items')
      .insert({
        fired_course_id: course.id,
        menu_item_id: menuItemId,
        item_name: 'Test Item',
        quantity: 2, // 2 Dishes = 10 units
        station_type: 'grill'
      })
      .select().single();

    // 5. Execute Bump
    const { data: success, error } = await supabase!.rpc('bump_order_item', {
      p_item_id: orderItem.id
    });

    expect(error).toBeNull();
    expect(success).toBe(true);

    // 6. Verify Stock: 100 - (5 * 2) = 90
    const { data: stock } = await supabase!
      .from('stock_levels')
      .select('quantity')
      .eq('ingredient_id', ingredientId)
      .single();

    expect(stock).not.toBeNull();
    expect(parseFloat(stock!.quantity)).toBe(90.0);
  });
});