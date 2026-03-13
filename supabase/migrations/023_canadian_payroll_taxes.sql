-- Migration 023: Canadian Payroll Tax (CPP/EI) Integration
-- Purpose: Automatically calculate employee withholdings and employer matching
-- Date: 2026-01-30

-- 1. Extend the process_payroll_for_event function
CREATE OR REPLACE FUNCTION process_payroll_for_event(p_event_id UUID)
RETURNS TABLE (
    gross_labor DECIMAL,
    employee_net DECIMAL,
    cpp_withheld DECIMAL,
    ei_withheld DECIMAL,
    employer_tax_cost DECIMAL
) AS $$
DECLARE
    v_gross_labor DECIMAL;
    v_staff_count INTEGER;
    v_ledger_id UUID;
    v_event_name TEXT;
    
    -- Tax Rates (2025/26 Estimates)
    v_cpp_rate CONSTANT DECIMAL := 0.0595; -- 5.95%
    v_ei_rate CONSTANT DECIMAL := 0.0166;  -- 1.66%
    v_ei_employer_mult CONSTANT DECIMAL := 1.4; -- Employer pays 1.4x EI
    
    v_cpp_total DECIMAL;
    v_ei_total DECIMAL;
    v_employer_cpp_match DECIMAL;
    v_employer_ei_match DECIMAL;
    v_net_pay_total DECIMAL;
BEGIN
    -- 1. Get gross unpaid labor
    SELECT SUM(pay_amount), COUNT(*) 
    INTO v_gross_labor, v_staff_count
    FROM staff_assignments
    WHERE event_id = p_event_id AND is_paid = false;

    IF v_gross_labor IS NULL OR v_gross_labor = 0 THEN
        RETURN QUERY SELECT 0.00, 0.00, 0.00, 0.00, 0.00;
        RETURN;
    END IF;

    -- 2. Calculate Taxes
    v_cpp_total := ROUND(v_gross_labor * v_cpp_rate, 2);
    v_ei_total := ROUND(v_gross_labor * v_ei_rate, 2);
    v_net_pay_total := v_gross_labor - v_cpp_total - v_ei_total;
    
    -- Employer portions
    v_employer_cpp_match := v_cpp_total;
    v_employer_ei_match := ROUND(v_ei_total * v_ei_employer_mult, 2);

    -- 3. Get event name
    SELECT COALESCE(event_name, name, 'Unknown Event') INTO v_event_name
    FROM events WHERE id = p_event_id;

    -- 4. Record Entries in Ledger
    
    -- A. The Net Pay (The actual cash leaving the business to workers)
    INSERT INTO financial_ledger (amount, tax_amount, transaction_type, category, description, reference_id, reference_type)
    VALUES (-v_net_pay_total, 0, 'expense', 'labor', 'Net Payroll: ' || v_event_name, p_event_id, 'payroll_net');

    -- B. CPP Liability (Employee portion + Employer Match)
    INSERT INTO financial_ledger (amount, tax_amount, transaction_type, category, description, reference_id, reference_type)
    VALUES (-(v_cpp_total + v_employer_cpp_match), 0, 'expense', 'labor', 'CPP Remittance Liability: ' || v_event_name, p_event_id, 'tax_cpp');

    -- C. EI Liability (Employee portion + Employer Match)
    INSERT INTO financial_ledger (amount, tax_amount, transaction_type, category, description, reference_id, reference_type)
    VALUES (-(v_ei_total + v_employer_ei_match), 0, 'expense', 'labor', 'EI Remittance Liability: ' || v_event_name, p_event_id, 'tax_ei');

    -- 5. Mark assignments as paid
    UPDATE staff_assignments
    SET is_paid = true, paid_at = NOW()
    WHERE event_id = p_event_id AND is_paid = false;

    RETURN QUERY SELECT 
        v_gross_labor, 
        v_net_pay_total, 
        v_cpp_total, 
        v_ei_total, 
        (v_employer_cpp_match + v_employer_ei_match);
END;
$$ LANGUAGE plpgsql;
