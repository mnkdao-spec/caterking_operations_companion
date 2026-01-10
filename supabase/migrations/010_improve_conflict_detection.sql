-- Migration: 010_improve_conflict_detection
-- Description: Improve check_staff_conflicts function to handle NULL values and edge cases
-- Author: AI Agent
-- Date: 2026-01-09

-- ============================================================================
-- UPDATE FUNCTION: check_staff_conflicts
-- Purpose: Add NULL handling and better error prevention
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
    AND sa.start_time IS NOT NULL
    AND sa.end_time IS NOT NULL
    AND sa.start_time < p_end_time
    AND sa.end_time > p_start_time;
  
  -- Check for existing event assignments (double-booking)
  -- Only check events that have valid dates and times
  RETURN QUERY
  SELECT 
    'double_booking'::TEXT as conflict_type,
    (e.event_date + COALESCE(e.event_time, '00:00:00'::TIME))::TIMESTAMPTZ as conflict_start,
    (e.event_date + COALESCE(e.event_time, '00:00:00'::TIME) + INTERVAL '1 hour' * COALESCE(sta.hours_assigned, 4))::TIMESTAMPTZ as conflict_end,
    CONCAT('Already assigned to: ', COALESCE(e.event_name, e.name, 'Unnamed Event')) as conflict_details
  FROM staff_assignments sta
  JOIN events e ON sta.event_id = e.id
  WHERE sta.staff_id = p_staff_id
    AND e.event_date IS NOT NULL  -- Only check events with valid dates
    AND e.status = 'Confirmed'    -- Only check confirmed events
    AND (e.event_date + COALESCE(e.event_time, '00:00:00'::TIME))::TIMESTAMPTZ < p_end_time
    AND ((e.event_date + COALESCE(e.event_time, '00:00:00'::TIME) + INTERVAL '1 hour' * COALESCE(sta.hours_assigned, 4))::TIMESTAMPTZ) > p_start_time;
    
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION check_staff_conflicts IS 'Returns all scheduling conflicts for a staff member during a given time period (IMPROVED: NULL handling and confirmed events only)';

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- To rollback, restore the function from migration 009
