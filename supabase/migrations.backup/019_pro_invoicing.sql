-- Migration 019: Professional Canadian Invoicing System
-- Purpose: Create robust, CRA-compliant invoicing infrastructure
-- Date: 2026-01-30

-- 1. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Branding & Tax Details
    business_name TEXT DEFAULT 'CaterKing Operations',
    business_hst_number TEXT, -- Ontario HST Number
    business_address TEXT,
    
    -- Invoice Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Financials
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 13.00, -- Ontario HST
    tax_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deposit_paid DECIMAL(12, 2) DEFAULT 0,
    balance_due DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Metadata
    status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, void
    notes TEXT,
    terms TEXT DEFAULT 'Due upon receipt. Thank you for your business!',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Invoice Items Table (Line Items)
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    category TEXT, -- 'food', 'labor', 'rental', 'service'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Automatic Totals Calculation Trigger
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET 
        subtotal = (SELECT SUM(total_price) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
        tax_total = (SELECT SUM(total_price) * (tax_rate / 100) FROM invoice_items i JOIN invoices v ON i.invoice_id = v.id WHERE i.invoice_id = NEW.invoice_id),
        total_amount = (SELECT SUM(total_price) * (1 + (tax_rate / 100)) FROM invoice_items i JOIN invoices v ON i.invoice_id = v.id WHERE i.invoice_id = NEW.invoice_id),
        balance_due = (SELECT (SUM(total_price) * (1 + (tax_rate / 100))) - deposit_paid FROM invoice_items i JOIN invoices v ON i.invoice_id = v.id WHERE i.invoice_id = NEW.invoice_id)
    WHERE id = NEW.invoice_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_items_total AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- 4. Invoice Number Sequence Function
CREATE OR REPLACE FUNCTION generate_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 1000) + 1 INTO next_num FROM invoices;
    RETURN 'INV-' || next_num;
END;
$$ LANGUAGE plpgsql;

-- 5. Auto-sync Paid Invoices to Financial Ledger
CREATE OR REPLACE FUNCTION sync_invoice_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        INSERT INTO financial_ledger (
            amount, 
            tax_amount,
            transaction_type, 
            category, 
            description, 
            reference_id, 
            reference_type, 
            transaction_date
        )
        VALUES (
            NEW.total_amount, 
            NEW.tax_total,
            'income', 
            'sales', 
            'Invoice Paid: ' || NEW.invoice_number, 
            NEW.id, 
            'invoice', 
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_to_ledger AFTER UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION sync_invoice_to_ledger();

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON invoice_items FOR ALL USING (true);
