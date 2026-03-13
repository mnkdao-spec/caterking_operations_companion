-- Migration: Event Labor Cost Synchronization
-- Implementation Plan Phase 2 Task 2

CREATE OR REPLACE FUNCTION sync_event_labor_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding event's actual labor cost
  IF NEW.event_id IS NOT NULL THEN
    UPDATE events
    SET labor_costs_actual = (
      SELECT COALESCE(SUM(total_pay), 0)
      FROM staff_shifts
      WHERE event_id = NEW.event_id
    )
    WHERE id = NEW.event_id;
  END IF;

  -- Also handle OLD event_id if it changed
  IF TG_OP = 'UPDATE' AND OLD.event_id IS NOT NULL AND OLD.event_id != COALESCE(NEW.event_id, '00000000-0000-0000-0000-000000000000'::UUID) THEN
    UPDATE events
    SET labor_costs_actual = (
      SELECT COALESCE(SUM(total_pay), 0)
      FROM staff_shifts
      WHERE event_id = OLD.event_id
    )
    WHERE id = OLD.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync costs
DROP TRIGGER IF EXISTS tr_sync_event_labor_costs ON staff_shifts;
CREATE TRIGGER tr_sync_event_labor_costs
  AFTER INSERT OR UPDATE OF total_pay, event_id ON staff_shifts
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_labor_costs();
