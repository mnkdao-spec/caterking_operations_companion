-- Migration 018: Payroll Linkage & Labor Cost Automation
-- Purpose: Connect staff assignments to the financial ledger
-- Date: 2026-01-30

-- 1. Add payment tracking to staff assignments
ALTER TABLE staff_assignments 
    ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ledger_reference_id UUID;

-- 2. Index for faster payroll queries
CREATE INDEX IF NOT EXISTS idx_staff_assignments_unpaid ON staff_assignments(event_id) WHERE is_paid = false;

-- 3. Payroll Processing Function
CREATE OR REPLACE FUNCTION process_payroll_for_event(p_event_id UUID)
RETURNS TABLE (
    total_paid DECIMAL,
    staff_count INTEGER
) AS $$
DECLARE
    v_total_labor DECIMAL;
    v_staff_count INTEGER;
    v_ledger_id UUID;
    v_event_name TEXT;
BEGIN
    -- 1. Calculate total unpaid amount for the event
    SELECT SUM(pay_amount), COUNT(*) 
    INTO v_total_labor, v_staff_count
    FROM staff_assignments
    WHERE event_id = p_event_id AND is_paid = false;

    IF v_total_labor IS NULL OR v_total_labor = 0 THEN
        RETURN QUERY SELECT 0.00, 0;
        RETURN;
    END IF;

    -- 2. Get event name for the ledger description
    SELECT COALESCE(event_name, name, 'Unknown Event') INTO v_event_name
    FROM events WHERE id = p_event_id;

    -- 3. Create entry in financial_ledger (Labor costs do not typically have HST ITCs unless paid to a corp)
    -- We assume these are wages/T4A payments (Net = Total)
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
        -v_total_labor, 
        0, 
        'expense', 
        'labor', 
        'Payroll Processed: ' || v_event_name || ' (' || v_staff_count || ' staff)', 
        p_event_id, 
        'payroll',
        NOW()
    )
    RETURNING id INTO v_ledger_id;

    -- 4. Mark assignments as paid and link to ledger
    UPDATE staff_assignments
    SET 
        is_paid = true,
        paid_at = NOW(),
        ledger_reference_id = v_ledger_id
    WHERE event_id = p_event_id AND is_paid = false;

    RETURN QUERY SELECT v_total_labor, v_staff_count;
END;
$$ LANGUAGE plpgsql;
