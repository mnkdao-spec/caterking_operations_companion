-- Migration 016: Automated Canadian Tax Logic
-- Purpose: Automate HST calculation (13%) for payments and bills
-- Date: 2026-01-30

-- 1. Updated Payment Trigger Function
CREATE OR REPLACE FUNCTION sync_payment_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    calculated_tax DECIMAL(12, 2);
BEGIN
    -- If hst_collected was not provided, assume 13% is included in the total amount
    IF (NEW.hst_collected IS NULL OR NEW.hst_collected = 0) THEN
        calculated_tax := NEW.amount - (NEW.amount / 1.13);
    ELSE
        calculated_tax := NEW.hst_collected;
    END IF;

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
        NEW.amount, 
        calculated_tax,
        'income', 
        'sales', 
        'Payment received: ' || COALESCE(NEW.reference_number, 'N/A'), 
        NEW.id, 
        'payment', 
        NEW.payment_date
    );
    
    -- Update the source record if we calculated the tax
    IF (NEW.hst_collected IS NULL OR NEW.hst_collected = 0) THEN
        UPDATE payments SET hst_collected = calculated_tax WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Updated Bill Trigger Function
CREATE OR REPLACE FUNCTION sync_bill_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    calculated_tax DECIMAL(12, 2);
BEGIN
    -- Only sync when marked as 'paid'
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        -- If hst_amount was not provided, assume 13% is included
        IF (NEW.hst_amount IS NULL OR NEW.hst_amount = 0) THEN
            calculated_tax := NEW.amount - (NEW.amount / 1.13);
        ELSE
            calculated_tax := NEW.hst_amount;
        END IF;

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
            -NEW.amount, 
            -calculated_tax,
            'expense', 
            NEW.category, 
            'Vendor Bill Paid: ' || NEW.vendor_name, 
            NEW.id, 
            'vendor_bill', 
            NOW()
        );

        -- Update the source record if we calculated the tax
        IF (NEW.hst_amount IS NULL OR NEW.hst_amount = 0) THEN
            UPDATE vendor_bills SET hst_amount = calculated_tax WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
