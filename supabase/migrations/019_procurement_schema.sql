-- Migration: Procurement & Payables Schema
-- Implementation Plan Phase 1

-- Create purchase_order_status enum
DO $$ BEGIN
    CREATE TYPE purchase_order_status AS ENUM ('draft', 'pending_approval', 'approved', 'partially_received', 'received', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status purchase_order_status DEFAULT 'draft' NOT NULL,
  total_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  authorized_by UUID REFERENCES auth.users(id),
  parent_po_id UUID REFERENCES purchase_orders(id), -- For backorders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create po_items table
CREATE TABLE IF NOT EXISTS po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id), -- Link to ingredients
  description TEXT NOT NULL,
  quantity_ordered NUMERIC(15, 4) NOT NULL DEFAULT 0,
  quantity_received NUMERIC(15, 4) NOT NULL DEFAULT 0,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  surge_threshold_percent NUMERIC(5, 2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ocr_audit_logs table
CREATE TABLE IF NOT EXISTS ocr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  raw_json JSONB NOT NULL,
  confidence_score NUMERIC(5, 2),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_ingredient_id ON po_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ocr_audit_logs_po_id ON ocr_audit_logs(po_id);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users on POs" ON purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on POs" ON purchase_orders FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated users on PO items" ON po_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on PO items" ON po_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated users on OCR logs" ON ocr_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on OCR logs" ON ocr_audit_logs FOR ALL TO authenticated USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
