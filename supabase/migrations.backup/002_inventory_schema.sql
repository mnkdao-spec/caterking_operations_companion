-- CaterKing Inventory Management Schema
-- Tracks ingredients, recipes, and stock levels with real-time decrement on order completion

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- 'oz', 'lb', 'ml', 'l', 'count', 'bunch', etc.
  category TEXT NOT NULL, -- 'protein', 'vegetable', 'grain', 'dairy', 'spice', etc.
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  reorder_level DECIMAL(12, 2) NOT NULL, -- Alert when stock falls below this
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Current stock levels
CREATE TABLE IF NOT EXISTS stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- NULL for permanent inventory
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id, event_id)
);

-- Recipe definitions (how much of each ingredient goes into a menu item)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(12, 2) NOT NULL, -- Amount used per serving
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, ingredient_id)
);

-- Inventory transactions (audit trail)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'initial_stock', 'decrement', 'adjustment', 'restock'
  quantity_change DECIMAL(12, 2) NOT NULL, -- Positive for add, negative for subtract
  quantity_before DECIMAL(12, 2) NOT NULL,
  quantity_after DECIMAL(12, 2) NOT NULL,
  reason TEXT, -- 'order_completed', 'waste', 'manual_adjustment', etc.
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  created_by TEXT, -- User ID or system
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Low stock alerts
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  current_level DECIMAL(12, 2) NOT NULL,
  reorder_level DECIMAL(12, 2) NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, ingredient_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_levels_ingredient_id ON stock_levels(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_event_id ON stock_levels(event_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_menu_item_id ON recipe_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_event_id ON inventory_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_ingredient_id ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order_item_id ON inventory_transactions(order_item_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_event_id ON low_stock_alerts(event_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_acknowledged ON low_stock_alerts(acknowledged);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies (allow all for now)
CREATE POLICY "Enable all access for ingredients" ON ingredients FOR ALL USING (true);
CREATE POLICY "Enable all access for stock_levels" ON stock_levels FOR ALL USING (true);
CREATE POLICY "Enable all access for recipe_ingredients" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY "Enable all access for inventory_transactions" ON inventory_transactions FOR ALL USING (true);
CREATE POLICY "Enable all access for low_stock_alerts" ON low_stock_alerts FOR ALL USING (true);

-- Function to decrement stock and create transaction
CREATE OR REPLACE FUNCTION decrement_stock(
  p_event_id UUID,
  p_menu_item_id UUID,
  p_order_item_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  low_stock_alerts_created INT
) AS $$
DECLARE
  v_recipe_row RECORD;
  v_stock_row RECORD;
  v_new_quantity DECIMAL;
  v_alerts_created INT := 0;
BEGIN
  -- Loop through all ingredients in the recipe
  FOR v_recipe_row IN
    SELECT ri.ingredient_id, ri.quantity, i.reorder_level
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    WHERE ri.menu_item_id = p_menu_item_id
  LOOP
    -- Get current stock level
    SELECT * INTO v_stock_row
    FROM stock_levels
    WHERE ingredient_id = v_recipe_row.ingredient_id
    AND (event_id = p_event_id OR event_id IS NULL)
    ORDER BY event_id DESC NULLS LAST
    LIMIT 1;

    IF v_stock_row IS NULL THEN
      -- No stock record found, skip
      CONTINUE;
    END IF;

    -- Calculate new quantity
    v_new_quantity := v_stock_row.quantity - (v_recipe_row.quantity * p_quantity);

    -- Update stock level
    UPDATE stock_levels
    SET quantity = v_new_quantity,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = v_stock_row.id;

    -- Create transaction record
    INSERT INTO inventory_transactions (
      event_id,
      ingredient_id,
      transaction_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reason,
      order_item_id,
      created_by
    ) VALUES (
      p_event_id,
      v_recipe_row.ingredient_id,
      'decrement',
      -(v_recipe_row.quantity * p_quantity),
      v_stock_row.quantity,
      v_new_quantity,
      'order_completed',
      p_order_item_id,
      'system'
    );

    -- Check if stock is below reorder level
    IF v_new_quantity < v_recipe_row.reorder_level THEN
      -- Create or update low stock alert
      INSERT INTO low_stock_alerts (
        event_id,
        ingredient_id,
        current_level,
        reorder_level
      ) VALUES (
        p_event_id,
        v_recipe_row.ingredient_id,
        v_new_quantity,
        v_recipe_row.reorder_level
      )
      ON CONFLICT (event_id, ingredient_id) DO UPDATE
      SET current_level = v_new_quantity,
          acknowledged = FALSE,
          acknowledged_at = NULL,
          acknowledged_by = NULL;

      v_alerts_created := v_alerts_created + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT true, 'Stock decremented successfully'::TEXT, v_alerts_created;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::TEXT, 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory status for an event
CREATE OR REPLACE FUNCTION get_inventory_status(p_event_id UUID)
RETURNS TABLE(
  ingredient_id UUID,
  ingredient_name TEXT,
  current_quantity DECIMAL,
  unit TEXT,
  reorder_level DECIMAL,
  status TEXT,
  cost_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    COALESCE(sl.quantity, 0),
    i.unit,
    i.reorder_level,
    CASE
      WHEN COALESCE(sl.quantity, 0) = 0 THEN 'out_of_stock'
      WHEN COALESCE(sl.quantity, 0) < i.reorder_level THEN 'low_stock'
      ELSE 'in_stock'
    END,
    COALESCE(sl.quantity, 0) * i.cost_per_unit
  FROM ingredients i
  LEFT JOIN stock_levels sl ON sl.ingredient_id = i.id AND sl.event_id = p_event_id
  ORDER BY i.category, i.name;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON stock_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
