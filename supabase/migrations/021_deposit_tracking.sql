-- Migration 021: Deposit Tracking & Cash Flow Guardrails
-- Purpose: Enforce 50% deposit rules and flag delinquent events
-- Date: 2026-01-30

-- 1. Add deposit requirement fields to invoices
ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS deposit_required_percentage DECIMAL(5, 2) DEFAULT 50.00,
    ADD COLUMN IF NOT EXISTS is_deposit_paid BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS deposit_due_date DATE;

-- 2. Create a function to check deposit status
CREATE OR REPLACE FUNCTION check_invoice_deposit_status()
RETURNS TRIGGER AS $$
DECLARE
    v_required_amount DECIMAL(12, 2);
BEGIN
    -- Calculate required amount (50% of total)
    v_required_amount := NEW.total_amount * (NEW.deposit_required_percentage / 100);
    
    -- If deposit paid meets or exceeds required amount, mark as paid
    IF (NEW.deposit_paid >= v_required_amount AND v_required_amount > 0) THEN
        NEW.is_deposit_paid := true;
    ELSE
        NEW.is_deposit_paid := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to auto-update deposit status on any financial change
CREATE TRIGGER trg_check_deposit_status
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION check_invoice_deposit_status();

-- 4. View: Cash Flow Risks (Upcoming events without paid deposits)
CREATE OR REPLACE VIEW deposit_delinquency_alerts AS
SELECT 
    e.id as event_id,
    e.event_name,
    e.event_date,
    c.name as client_name,
    i.id as invoice_id,
    i.invoice_number,
    i.total_amount,
    i.deposit_paid,
    (i.total_amount * (i.deposit_required_percentage / 100)) as deposit_required,
    i.balance_due,
    (e.event_date - CURRENT_DATE) as days_until_event
FROM events e
JOIN invoices i ON e.id = i.event_id
JOIN clients c ON e.client_id = c.id
WHERE i.is_deposit_paid = false 
  AND i.status != 'paid'
  AND e.status = 'confirmed'
  AND e.event_date >= CURRENT_DATE;
