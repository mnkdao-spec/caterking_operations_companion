-- Migration: Initialize Finance & Suppliers
-- Implementation Plan Phase 3

-- Create invoice_status enum if not exists
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create suppliers table (Vendors)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email VARCHAR(320),
  phone VARCHAR(50),
  address TEXT,
  payment_terms TEXT, -- e.g., "Net 30", "Due on Receipt"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure invoices table has proper structure for both AP and AR
-- Note: invoices might already exist from previous work, so we use ALTER/CREATE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id), -- Nullable for Sales Invoices (AR)
  client_id UUID REFERENCES clients(id),     -- Nullable for Purchase Invoices (AP)
  event_id UUID,                             -- Link to specific catering event
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status invoice_status DEFAULT 'draft' NOT NULL,
  subtotal NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  tax_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice_items table (Line Items)
-- Using invoice_items name to match 017 migration references
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Calculated field
  tax_rate NUMERIC(5, 2) DEFAULT 0.00,
  ledger_account_id UUID REFERENCES ledger_accounts(id), -- Link to COA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_event_id ON invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read for authenticated users" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full access for suppliers" ON suppliers FOR ALL TO authenticated USING (true);

CREATE POLICY "Public read for authenticated users" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full access for invoices" ON invoices FOR ALL TO authenticated USING (true);

CREATE POLICY "Public read for authenticated users" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full access for invoice_items" ON invoice_items FOR ALL TO authenticated USING (true);
