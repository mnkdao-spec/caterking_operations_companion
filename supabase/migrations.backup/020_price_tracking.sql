-- Migration 020: Ingredient Price Tracking & Vendor Integrity
-- Purpose: Track price fluctuations and prevent vendor overcharging
-- Date: 2026-01-30

-- 1. Create Price History table
CREATE TABLE IF NOT EXISTS ingredient_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    vendor_bill_id UUID REFERENCES vendor_bills(id) ON DELETE SET NULL,
    price_paid DECIMAL(12, 2) NOT NULL, -- Price per unit (net of HST)
    unit TEXT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add 'current_avg_cost' to ingredients for margin calculations
ALTER TABLE ingredients 
    ADD COLUMN IF NOT EXISTS last_price_paid DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS avg_price_paid DECIMAL(12, 2);

-- 3. Trigger: Update price history when a vendor bill is linked to inventory
-- Note: In a real ERP, we'd have line items for bills. 
-- For now, we'll create a link table for 'Bill Items' to match ingredients.

CREATE TABLE IF NOT EXISTS vendor_bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_bill_id UUID REFERENCES vendor_bills(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL, -- Price per unit
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Function: Update Ingredient Costs
CREATE OR REPLACE FUNCTION update_ingredient_costs()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into history
    INSERT INTO ingredient_price_history (ingredient_id, vendor_bill_id, price_paid, unit, purchase_date)
    SELECT NEW.ingredient_id, NEW.vendor_bill_id, NEW.unit_price, i.unit, CURRENT_DATE
    FROM ingredients i WHERE i.id = NEW.ingredient_id;

    -- Update last and avg price on the ingredient
    UPDATE ingredients
    SET 
        last_price_paid = NEW.unit_price,
        avg_price_paid = (
            SELECT AVG(price_paid) 
            FROM ingredient_price_history 
            WHERE ingredient_id = NEW.ingredient_id
        )
    WHERE id = NEW.ingredient_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bill_item_added AFTER INSERT ON vendor_bill_items
    FOR EACH ROW EXECUTE FUNCTION update_ingredient_costs();

-- 5. Logic: Flag Significant Price Increases (Anti-Fraud/Overcharge)
CREATE OR REPLACE VIEW vendor_price_alerts AS
SELECT 
    i.name as ingredient_name,
    vbi.unit_price as new_price,
    i.avg_price_paid as historical_avg,
    ((vbi.unit_price - i.avg_price_paid) / i.avg_price_paid * 100) as percent_increase,
    vb.vendor_name,
    vb.bill_date
FROM vendor_bill_items vbi
JOIN ingredients i ON vbi.ingredient_id = i.id
JOIN vendor_bills vb ON vbi.vendor_bill_id = vb.id
WHERE i.avg_price_paid > 0 
  AND vbi.unit_price > (i.avg_price_paid * 1.10); -- Flag > 10% increase
