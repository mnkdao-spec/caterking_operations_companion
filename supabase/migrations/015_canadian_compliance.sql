-- Migration 015: Canadian/Ontario Tax Compliance
-- Purpose: Add HST tracking and CRA-aligned categorization
-- Date: 2026-01-30

-- 1. Add HST fields to Vendor Bills
ALTER TABLE vendor_bills 
    ADD COLUMN IF NOT EXISTS hst_amount DECIMAL(12, 2) DEFAULT 0 CHECK (hst_amount >= 0),
    ADD COLUMN IF NOT EXISTS vendor_hst_number TEXT;

-- 2. Add HST fields to Client Payments
ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS hst_collected DECIMAL(12, 2) DEFAULT 0 CHECK (hst_collected >= 0);

-- 3. Add HST fields to Central Ledger
ALTER TABLE financial_ledger 
    ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_hst_eligible BOOLEAN DEFAULT true;

-- 4. Update Category Enum to match CRA Form T2125 (Statement of Business or Professional Activities)
-- Note: PostgreSQL doesn't allow easy ALTER TYPE for Enums in transactions, 
-- so we'll ensure our business logic maps these to the existing Enum or we use a flexible TEXT field.
-- For now, we will use the existing Enum but map it in the UI.

-- 5. Reporting Function: Canadian Tax Summary
CREATE OR REPLACE FUNCTION get_canadian_tax_summary(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
    total_sales_net DECIMAL,
    hst_collected DECIMAL,
    total_expenses_net DECIMAL,
    hst_paid_itc DECIMAL,
    net_hst_remittance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(CASE WHEN transaction_type = 'income' THEN (amount - tax_amount) ELSE 0 END) as total_sales_net,
        SUM(CASE WHEN transaction_type = 'income' THEN tax_amount ELSE 0 END) as hst_collected,
        SUM(CASE WHEN transaction_type = 'expense' THEN (ABS(amount) - ABS(tax_amount)) ELSE 0 END) as total_expenses_net,
        SUM(CASE WHEN transaction_type = 'expense' THEN ABS(tax_amount) ELSE 0 END) as hst_paid_itc,
        (SUM(CASE WHEN transaction_type = 'income' THEN tax_amount ELSE 0 END) - 
         SUM(CASE WHEN transaction_type = 'expense' THEN ABS(tax_amount) ELSE 0 END)) as net_hst_remittance
    FROM financial_ledger
    WHERE transaction_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;
