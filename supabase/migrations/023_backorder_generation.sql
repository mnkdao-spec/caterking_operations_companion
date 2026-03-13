-- Migration: Backorder PO Generation
-- Implementation Plan Phase 4 Task 3

CREATE OR REPLACE FUNCTION generate_backorder_po(p_original_po_id UUID)
RETURNS UUID AS $$
DECLARE
  v_new_po_id UUID;
  v_item_count INT;
BEGIN
  -- 1. Check if there are any items with unreceived quantities
  SELECT COUNT(*) INTO v_item_count
  FROM po_items
  WHERE po_id = p_original_po_id
  AND quantity_ordered > quantity_received;

  IF v_item_count = 0 THEN
    RETURN NULL;
  END IF;

  -- 2. Create the new Backorder PO
  INSERT INTO purchase_orders (
    supplier_id, 
    status, 
    total_amount, 
    backorder_from_po_id,
    authorized_by
  )
  SELECT 
    supplier_id, 
    'approved', -- Backorders are pre-approved
    0, 
    p_original_po_id,
    authorized_by
  FROM purchase_orders
  WHERE id = p_original_po_id
  RETURNING id INTO v_new_po_id;

  -- 3. Move unreceived quantities to the new PO
  INSERT INTO po_items (
    po_id,
    ingredient_id,
    description,
    quantity_ordered,
    unit_price,
    surge_threshold_percent
  )
  SELECT 
    v_new_po_id,
    ingredient_id,
    description,
    (quantity_ordered - quantity_received),
    unit_price,
    surge_threshold_percent
  FROM po_items
  WHERE po_id = p_original_po_id
  AND quantity_ordered > quantity_received;

  -- 4. Update the new PO total amount
  UPDATE purchase_orders
  SET total_amount = (
    SELECT SUM(quantity_ordered * unit_price)
    FROM po_items
    WHERE po_id = v_new_po_id
  )
  WHERE id = v_new_po_id;

  RETURN v_new_po_id;
END;
$$ LANGUAGE plpgsql;
