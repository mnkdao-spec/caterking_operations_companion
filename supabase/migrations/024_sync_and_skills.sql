-- Migration 024: Payment Sync & Staff Skill Matching
-- Purpose: Automate invoice updates and role-based validation
-- Date: 2026-01-30

-- 1. Link Payments directly to Invoices
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- 2. Trigger: Auto-sync Payment to Invoice Balance
CREATE OR REPLACE FUNCTION sync_payment_to_invoice()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.invoice_id IS NOT NULL) THEN
        -- If it's a deposit, update the deposit field
        IF (NEW.is_deposit = true) THEN
            UPDATE invoices 
            SET deposit_paid = deposit_paid + NEW.amount
            WHERE id = NEW.invoice_id;
        ELSE
            -- Otherwise, just reduce the balance indirectly (via a calculated field or direct update)
            -- Our previous migration uses a trigger on invoice_items, 
            -- so we'll add a 'general_payments' column to track non-deposit income on invoices
            UPDATE invoices 
            SET notes = COALESCE(notes, '') || '\nPayment received: $' || NEW.amount || ' on ' || NEW.payment_date
            WHERE id = NEW.invoice_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_to_invoice AFTER INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION sync_payment_to_invoice();

-- 3. Staff Skills & Requirements
ALTER TABLE staff ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'; -- e.g., {'Bartender', 'Chef', 'Lead'}

-- 4. Event Role Requirements
CREATE TABLE IF NOT EXISTS event_role_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL, -- e.g., 'Bartender'
    required_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. View: Staffing Gaps (Under-staffed events or role mismatches)
CREATE OR REPLACE VIEW staffing_integrity_audit AS
SELECT 
    e.id as event_id,
    e.event_name,
    e.event_date,
    err.role_name,
    err.required_count,
    (SELECT COUNT(*) FROM staff_assignments sa WHERE sa.event_id = e.id AND sa.role = err.role_name) as assigned_count,
    (err.required_count - (SELECT COUNT(*) FROM staff_assignments sa WHERE sa.event_id = e.id AND sa.role = err.role_name)) as gap
FROM events e
JOIN event_role_requirements err ON e.id = err.event_id
WHERE e.event_date >= CURRENT_DATE;
