-- Migration: Menu Item Recipes and Precise Bumping
-- Implementation Plan Phase 2 Task 1

-- 1. Recipe Linkage (Many-to-Many between Menu Items and Ingredients)
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_required NUMERIC(15, 4) NOT NULL, -- Amount used for ONE serving
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, ingredient_id)
);

-- 2. Atomic Bump Function
CREATE OR REPLACE FUNCTION bump_order_item(p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_menu_item_id UUID;
  v_quantity INT;
  v_recipe_record RECORD;
BEGIN
  -- 1. Get item info and mark as completed
  UPDATE order_items
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = p_item_id
  AND status != 'completed'
  RETURNING menu_item_id, quantity INTO v_menu_item_id, v_quantity;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Decrement inventory based on recipe
  FOR v_recipe_record IN 
    SELECT ingredient_id, quantity_required 
    FROM menu_item_ingredients 
    WHERE menu_item_id = v_menu_item_id
  LOOP
    UPDATE stock_levels
    SET quantity = quantity - (v_recipe_record.quantity_required * v_quantity)
    WHERE ingredient_id = v_recipe_record.ingredient_id;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Enable RLS
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for menu_item_ingredients" ON menu_item_ingredients FOR ALL USING (true);
