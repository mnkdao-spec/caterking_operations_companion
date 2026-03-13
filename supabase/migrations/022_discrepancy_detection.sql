-- Migration: Discrepancy Detection Logic (Fixed Syntax)
-- Implementation Plan Phase 4 Task 1

-- Create discrepancies table for detailed reporting
CREATE TABLE IF NOT EXISTS po_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES po_items(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- 'quantity', 'unit_price'
  expected_value NUMERIC(15, 4) NOT NULL,
  actual_value NUMERIC(15, 4) NOT NULL,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to detect discrepancies from OCR logs
CREATE OR REPLACE FUNCTION detect_po_discrepancies(p_po_id UUID)
RETURNS TABLE(
  discrepancy_count INT,
  needs_review BOOLEAN
) AS $$
DECLARE
  v_latest_log_record RECORD;
  v_ocr_item RECORD;
  v_po_item RECORD;
  v_count INT := 0;
BEGIN
  -- 1. Get the latest OCR log for this PO
  SELECT * INTO v_latest_log_record
  FROM ocr_audit_logs
  WHERE po_id = p_po_id
  ORDER BY processed_at DESC
  LIMIT 1;

  IF v_latest_log_record IS NULL THEN
    RETURN QUERY SELECT 0, FALSE;
    RETURN;
  END IF;

  -- 2. Clear old unresolved discrepancies for this PO
  DELETE FROM po_discrepancies WHERE po_id = p_po_id AND resolved = FALSE;

  -- 3. Compare OCR items with PO items
  FOR v_ocr_item IN 
    SELECT * FROM jsonb_to_recordset(v_latest_log_record.raw_json->'items') 
    AS x(item_desc TEXT, qty NUMERIC, price NUMERIC)
  LOOP
    -- Find matching PO item by description
    SELECT * INTO v_po_item
    FROM po_items
    WHERE po_id = p_po_id
    AND (description ILIKE '%' || v_ocr_item.item_desc || '%' OR v_ocr_item.item_desc ILIKE '%' || description || '%')
    LIMIT 1;

    IF v_po_item IS NOT NULL THEN
      -- Check Quantity
      IF ABS(v_po_item.quantity_ordered - v_ocr_item.qty) > 0.001 THEN
        INSERT INTO po_discrepancies (po_id, item_id, field_name, expected_value, actual_value, severity)
        VALUES (p_po_id, v_po_item.id, 'quantity', v_po_item.quantity_ordered, v_ocr_item.qty, 'high');
        v_count := v_count + 1;
      END IF;

      -- Check Price (with threshold)
      IF v_ocr_item.price > (v_po_item.unit_price * (1 + v_po_item.surge_threshold_percent / 100)) THEN
        INSERT INTO po_discrepancies (po_id, item_id, field_name, expected_value, actual_value, severity)
        VALUES (p_po_id, v_po_item.id, 'unit_price', v_po_item.unit_price, v_ocr_item.price, 'medium');
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- 4. Update PO status if discrepancies found
  IF v_count > 0 THEN
    -- Check if status enum already has needs_review, handled in separate call if needed
    UPDATE purchase_orders SET status = 'pending_approval' WHERE id = p_po_id;
  END IF;

  RETURN QUERY SELECT v_count, v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE po_discrepancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for po_discrepancies" ON po_discrepancies FOR ALL USING (true);