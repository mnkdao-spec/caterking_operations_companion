-- Inventory Transaction Logging Schema
-- Adds comprehensive transaction logging and rollback support

-- Transaction log table for audit trail and rollback capability
CREATE TABLE IF NOT EXISTS inventory_transaction_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'committed', 'rolled_back', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);

-- Transaction changes table to track individual ingredient changes within a transaction
CREATE TABLE IF NOT EXISTS inventory_transaction_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_log_id UUID NOT NULL REFERENCES inventory_transaction_log(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_before DECIMAL(12, 2) NOT NULL,
  quantity_after DECIMAL(12, 2) NOT NULL,
  quantity_change DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_log_event_id ON inventory_transaction_log(event_id);
CREATE INDEX IF NOT EXISTS idx_transaction_log_order_item_id ON inventory_transaction_log(order_item_id);
CREATE INDEX IF NOT EXISTS idx_transaction_log_status ON inventory_transaction_log(status);
CREATE INDEX IF NOT EXISTS idx_transaction_log_transaction_id ON inventory_transaction_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_changes_transaction_log_id ON inventory_transaction_changes(transaction_log_id);
CREATE INDEX IF NOT EXISTS idx_transaction_changes_ingredient_id ON inventory_transaction_changes(ingredient_id);

-- Enable RLS
ALTER TABLE inventory_transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transaction_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies (allow all for now)
CREATE POLICY "Enable all access for transaction_log" ON inventory_transaction_log FOR ALL USING (true);
CREATE POLICY "Enable all access for transaction_changes" ON inventory_transaction_changes FOR ALL USING (true);

-- Function to check if order item has been processed (idempotency)
CREATE OR REPLACE FUNCTION is_order_item_processed(p_order_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM inventory_transaction_log
  WHERE order_item_id = p_order_item_id
  AND status = 'committed';
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a transaction
CREATE OR REPLACE FUNCTION rollback_inventory_transaction(p_transaction_id TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  items_rolled_back INT
) AS $$
DECLARE
  v_txn_id UUID;
  v_change_row RECORD;
  v_items_rolled_back INT := 0;
BEGIN
  -- Find the transaction log entry
  SELECT id INTO v_txn_id
  FROM inventory_transaction_log
  WHERE transaction_id = p_transaction_id
  AND status = 'committed';
  
  IF v_txn_id IS NULL THEN
    RETURN QUERY SELECT false, 'Transaction not found or not committed'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Rollback each change
  FOR v_change_row IN
    SELECT * FROM inventory_transaction_changes
    WHERE transaction_log_id = v_txn_id
  LOOP
    -- Restore stock to before state
    UPDATE stock_levels
    SET quantity = v_change_row.quantity_before,
        updated_at = NOW()
    WHERE ingredient_id = v_change_row.ingredient_id;
    
    -- Create reversal transaction record
    INSERT INTO inventory_transactions (
      event_id,
      ingredient_id,
      transaction_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reason,
      created_by
    ) SELECT
      itl.event_id,
      v_change_row.ingredient_id,
      'adjustment',
      v_change_row.quantity_change * -1,
      v_change_row.quantity_after,
      v_change_row.quantity_before,
      'rollback_transaction',
      'system'
    FROM inventory_transaction_log itl
    WHERE itl.id = v_txn_id;
    
    v_items_rolled_back := v_items_rolled_back + 1;
  END LOOP;
  
  -- Update transaction log status
  UPDATE inventory_transaction_log
  SET status = 'rolled_back',
      rolled_back_at = NOW()
  WHERE id = v_txn_id;
  
  RETURN QUERY SELECT true, 'Transaction rolled back successfully'::TEXT, v_items_rolled_back;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::TEXT, 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get transaction details with all changes
CREATE OR REPLACE FUNCTION get_transaction_details(p_transaction_id TEXT)
RETURNS TABLE(
  transaction_id TEXT,
  event_id UUID,
  order_item_id UUID,
  menu_item_id UUID,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  ingredient_id UUID,
  quantity_before DECIMAL,
  quantity_after DECIMAL,
  quantity_change DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    itl.transaction_id,
    itl.event_id,
    itl.order_item_id,
    itl.menu_item_id,
    itl.status,
    itl.created_at,
    itl.completed_at,
    itc.ingredient_id,
    itc.quantity_before,
    itc.quantity_after,
    itc.quantity_change
  FROM inventory_transaction_log itl
  LEFT JOIN inventory_transaction_changes itc ON itc.transaction_log_id = itl.id
  WHERE itl.transaction_id = p_transaction_id
  ORDER BY itc.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get unprocessed order items (for recovery/debugging)
CREATE OR REPLACE FUNCTION get_unprocessed_order_items(p_event_id UUID)
RETURNS TABLE(
  order_item_id UUID,
  menu_item_id UUID,
  quantity INTEGER,
  station TEXT,
  status TEXT,
  fired_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.id,
    oi.menu_item_id,
    oi.quantity,
    oi.station,
    oi.status,
    oi.fired_at
  FROM order_items oi
  JOIN fired_courses fc ON fc.id = oi.fired_course_id
  WHERE fc.event_id = p_event_id
  AND oi.status = 'done'
  AND NOT is_order_item_processed(oi.id)
  ORDER BY oi.fired_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_transaction_log_updated_at BEFORE UPDATE ON inventory_transaction_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
