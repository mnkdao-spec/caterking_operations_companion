import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase-client';

describe('KDS Core Logic', () => {
  it('should retrieve target_prep_time via joined menu_items', async () => {
    // 1. Get an event and menu item
    const { data: events } = await supabase!.from('events').select('id').limit(1);
    const { data: menuItems } = await supabase!.from('menu_items').select('id, target_prep_time').limit(1);
    
    if (!events || !menuItems || events.length === 0 || menuItems.length === 0) {
      console.warn('Insufficient data for KDS test');
      return;
    }

    const eventId = events[0].id;
    const menuItemId = menuItems[0].id;
    const targetTime = menuItems[0].target_prep_time;

    // 2. Create Fired Course
    const { data: course } = await supabase!
      .from('fired_courses')
      .insert({ event_id: eventId, course_name: 'Test Course' })
      .select()
      .single();

    // 3. Create Order Item
    await supabase!
      .from('order_items')
      .insert({
        fired_course_id: course.id,
        menu_item_id: menuItemId,
        item_name: 'Test Dish',
        station_type: 'grill'
      });

    // 4. Verify Join Query
    const { data: result, error } = await supabase!
      .from('order_items')
      .select('*, menu_items(target_prep_time)')
      .eq('fired_course_id', course.id)
      .single();

    expect(error).toBeNull();
    expect(result.menu_items.target_prep_time).toBe(targetTime);
  });
});