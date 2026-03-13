-- Migration: Automatic PO Drafting from Low Stock
-- Implementation Plan Phase 2 Task 3

CREATE OR REPLACE FUNCTION draft_po_from_low_stock()
RETURNS TABLE(
  po_id UUID,
  supplier_name TEXT,
  item_count INT
) AS $$
DECLARE
  v_supplier_record RECORD;
  v_new_po_id UUID;
  v_item_count INT;
BEGIN
  -- 1. Identify suppliers with low stock items
  FOR v_supplier_record IN 
    SELECT DISTINCT i.supplier as s_name
    FROM ingredients i
    JOIN stock_levels sl ON i.id = sl.ingredient_id
    WHERE sl.quantity < i.reorder_level
    AND i.supplier IS NOT NULL
    AND i.supplier != ''
  LOOP
    -- 2. Check if a draft PO already exists for this supplier to avoid duplicates
    -- We search by supplier name in the suppliers table
    DECLARE
      v_supplier_id UUID;
    BEGIN
      SELECT id INTO v_supplier_id FROM suppliers WHERE name = v_supplier_record.s_name LIMIT 1;
      
      IF v_supplier_id IS NOT NULL THEN
        -- Check for existing draft PO
        SELECT id INTO v_new_po_id 
        FROM purchase_orders 
        WHERE supplier_id = v_supplier_id 
        AND status = 'draft' 
        LIMIT 1;

        -- 3. If no draft PO exists, create one
        IF v_new_po_id IS NULL THEN
          INSERT INTO purchase_orders (supplier_id, status, total_amount)
          VALUES (v_supplier_id, 'draft', 0)
          RETURNING id INTO v_new_po_id;
        END IF;

        -- 4. Add items that are below threshold and not already in the PO
        INSERT INTO po_items (po_id, ingredient_id, description, quantity_ordered, unit_price)
        SELECT 
          v_new_po_id, 
          i.id, 
          i.name, 
          (i.reorder_level * 2) - sl.quantity, -- Order enough to reach 2x reorder level
          i.cost_per_unit
        FROM ingredients i
        JOIN stock_levels sl ON i.id = sl.ingredient_id
        WHERE i.supplier = v_supplier_record.s_name
        AND sl.quantity < i.reorder_level
        AND NOT EXISTS (
          SELECT 1 FROM po_items WHERE po_id = v_new_po_id AND ingredient_id = i.id
        );

        -- 5. Update PO total amount
        UPDATE purchase_orders
        SET total_amount = (
          SELECT SUM(quantity_ordered * unit_price)
          FROM po_items
          WHERE po_id = v_new_po_id
        )
        WHERE id = v_new_po_id;

        -- 6. Record for return
        SELECT COUNT(*) INTO v_item_count FROM po_items WHERE po_id = v_new_po_id;
        po_id := v_new_po_id;
        supplier_name := v_supplier_record.s_name;
        item_count := v_item_count;
        RETURN NEXT;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
