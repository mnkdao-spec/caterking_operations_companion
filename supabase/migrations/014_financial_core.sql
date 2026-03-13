-- Migration 014: Financial Core & Ledger System
-- Purpose: Establish a central ledger for all business transactions
-- Date: 2026-01-30

-- 1. Create Enums for strict data integrity
DO $$ BEGIN
    CREATE TYPE financial_transaction_type AS ENUM ('income', 'expense', 'investment', 'draw');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_category AS ENUM (
        'food_cost', 'labor', 'licensing', 'equipment', 
        'utility', 'marketing', 'sales', 'rent', 'insurance', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'check', 'credit_card', 'bank_transfer', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bill_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Vendor Bills Table (Accounts Payable)
CREATE TABLE IF NOT EXISTS vendor_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status bill_status DEFAULT 'pending',
    category financial_category DEFAULT 'food_cost',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Client Payments Table (Accounts Receivable)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    method payment_method DEFAULT 'credit_card',
    reference_number TEXT, -- Check number, Transaction ID, etc.
    is_deposit BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Central Financial Ledger (The "Truth")
CREATE TABLE IF NOT EXISTS financial_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL, -- Positive for income, negative for expense
    transaction_type financial_transaction_type NOT NULL,
    category financial_category NOT NULL,
    description TEXT NOT NULL,
    
    -- Links to source documents
    reference_id UUID, -- ID of vendor_bill, payment, or staff_assignment
    reference_type TEXT, -- 'vendor_bill', 'payment', 'labor', 'capital'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Capital & Investments Table
CREATE TABLE IF NOT EXISTS capital_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name TEXT NOT NULL, -- Investor name or Owner name
    amount DECIMAL(12, 2) NOT NULL,
    flow_type financial_transaction_type NOT NULL CHECK (flow_type IN ('investment', 'draw')),
    flow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for Reporting Performance
CREATE INDEX IF NOT EXISTS idx_ledger_date ON financial_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ledger_category ON financial_ledger(category);
CREATE INDEX IF NOT EXISTS idx_payments_event ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_status ON vendor_bills(status);

-- 7. Automated Ledger Sync (Triggers)

-- Function to sync payments to ledger
CREATE OR REPLACE FUNCTION sync_payment_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO financial_ledger (amount, transaction_type, category, description, reference_id, reference_type, transaction_date)
    VALUES (NEW.amount, 'income', 'sales', 'Payment received: ' || COALESCE(NEW.reference_number, 'N/A'), NEW.id, 'payment', NEW.payment_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_payment AFTER INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION sync_payment_to_ledger();

-- Function to sync paid bills to ledger
CREATE OR REPLACE FUNCTION sync_bill_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        INSERT INTO financial_ledger (amount, transaction_type, category, description, reference_id, reference_type, transaction_date)
        VALUES (-NEW.amount, 'expense', NEW.category, 'Vendor Bill Paid: ' || NEW.vendor_name, NEW.id, 'vendor_bill', NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_bill AFTER UPDATE ON vendor_bills
    FOR EACH ROW EXECUTE FUNCTION sync_bill_to_ledger();

-- 8. Reporting Function (The Accounting Engine)
CREATE OR REPLACE FUNCTION get_financial_summary(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_profit DECIMAL,
    labor_costs DECIMAL,
    food_costs DECIMAL,
    investment_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(CASE WHEN amount > 0 AND transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 AND transaction_type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses,
        SUM(amount) as net_profit,
        SUM(CASE WHEN category = 'labor' THEN ABS(amount) ELSE 0 END) as labor_costs,
        SUM(CASE WHEN category = 'food_cost' THEN ABS(amount) ELSE 0 END) as food_costs,
        SUM(CASE WHEN transaction_type = 'investment' THEN amount ELSE 0 END) as investment_total
    FROM financial_ledger
    WHERE transaction_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE vendor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON vendor_bills FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON financial_ledger FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON capital_flows FOR ALL USING (true);
