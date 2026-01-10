-- Migration: 009_fix_conflict_detection
-- Description: Fix check_staff_conflicts function to use correct event column names
-- Author: AI Agent
-- Date: 2026-01-09

-- ============================================================================
-- UPDATE FUNCTION: check_staff_conflicts
-- Purpose: Fix column references to match actual events table schema
-- ============================================================================

CREATE OR REPLACE FUNCTION check_staff_conflicts(
  p_staff_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
) RETURNS TABLE (
  conflict_type TEXT,
  conflict_start TIMESTAMPTZ,
  conflict_end TIMESTAMPTZ,
  conflict_details TEXT
) AS $$
BEGIN
  -- Check for availability conflicts (time-off, sick days, etc.)
  RETURN QUERY
  SELECT 
    'availability'::TEXT as conflict_type,
    sa.start_time as conflict_start,
    sa.end_time as conflict_end,
    CONCAT(sa.reason, ': ', COALESCE(sa.notes, 'No details')) as conflict_details
  FROM staff_availability sa
  WHERE sa.staff_id = p_staff_id
    AND sa.start_time < p_end_time
    AND sa.end_time > p_start_time;
  
  -- Check for existing event assignments (double-booking)
  -- Fixed: Use event_date and event_time columns instead of start_time
  RETURN QUERY
  SELECT 
    'double_booking'::TEXT as conflict_type,
    (e.event_date + COALESCE(e.event_time, '00:00:00'::TIME))::TIMESTAMPTZ as conflict_start,
    (e.event_date + COALESCE(e.event_time, '00:00:00'::TIME) + INTERVAL '1 hour' * COALESCE(sta.hours_assigned, 4))::TIMESTAMPTZ as conflict_end,
    CONCAT('Already assigned to: ', COALESCE(e.event_name, e.name, 'Unnamed Event')) as conflict_details
  FROM staff_assignments sta
  JOIN events e ON sta.event_id = e.id
  WHERE sta.staff_id = p_staff_id
    AND (e.event_date + COALESCE(e.event_time, '00:00:00'::TIME))::TIMESTAMPTZ < p_end_time
    AND ((e.event_date + COALESCE(e.event_time, '00:00:00'::TIME) + INTERVAL '1 hour' * COALESCE(sta.hours_assigned, 4))::TIMESTAMPTZ) > p_start_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION check_staff_conflicts IS 'Returns all scheduling conflicts for a staff member during a given time period (FIXED: uses event_date + event_time)';

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- To rollback, restore the original function from migration 008
