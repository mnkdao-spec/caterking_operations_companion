-- Migration: Payroll Calculation Logic
-- Implementation Plan Phase 2 Task 1

CREATE OR REPLACE FUNCTION calculate_shift_pay()
RETURNS TRIGGER AS $$
DECLARE
  v_hours NUMERIC;
  v_reg_hours NUMERIC;
  v_ot_hours NUMERIC;
BEGIN
  -- 1. Calculate hours if clock_out is set
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    v_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
    
    -- 2. Apply Overtime Rules (e.g., > 8 hours = 1.5x)
    IF v_hours > 8 THEN
      v_reg_hours := 8;
      v_ot_hours := v_hours - 8;
    ELSE
      v_reg_hours := v_hours;
      v_ot_hours := 0;
    END IF;

    -- 3. Update NEW record
    NEW.total_hours := v_hours;
    NEW.total_pay := (v_reg_hours * NEW.hourly_rate) + (v_ot_hours * NEW.hourly_rate * 1.5);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate pay on clock_out
DROP TRIGGER IF EXISTS tr_calculate_shift_pay ON staff_shifts;
CREATE TRIGGER tr_calculate_shift_pay
  BEFORE UPDATE ON staff_shifts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_shift_pay();
