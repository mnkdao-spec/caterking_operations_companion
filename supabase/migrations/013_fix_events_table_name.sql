-- Migration 013: Fix check_staff_conflicts to Use Correct Table Name
-- Description: Updates the function to use "events" table instead of "kds_events"
--              (web ERP uses "events", mobile app uses "kds_events")
-- Date: 2026-01-09
-- Author: Manus AI

-- Drop the existing function
DROP FUNCTION IF EXISTS check_staff_conflicts(UUID, UUID, DATE, TIME) CASCADE;

-- Recreate the function with correct table name
CREATE OR REPLACE FUNCTION check_staff_conflicts(
  p_staff_id UUID,
  p_event_id UUID,
  p_event_date DATE,
  p_event_time TIME
)
RETURNS TABLE (
  conflict_type TEXT,
  conflict_start TEXT,
  conflict_end TEXT,
  conflict_details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return conflicting staff assignments for the same staff member
  -- on the same date and time, excluding the current event
  RETURN QUERY
  SELECT 
    'double_booking'::TEXT AS conflict_type,
    (e.event_date || ' ' || e.event_time)::TEXT AS conflict_start,
    (e.event_date || ' ' || (e.event_time::TIME + INTERVAL '8 hours')::TIME)::TEXT AS conflict_end,
    ('Already assigned to "' || e.event_name || '" as ' || sa.role || ' at ' || e.venue_name)::TEXT AS conflict_details
  FROM staff_assignments sa
  INNER JOIN events e ON sa.event_id = e.id
  WHERE sa.staff_id = p_staff_id
    AND e.id != COALESCE(p_event_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND e.event_date = p_event_date
    AND e.event_time IS NOT NULL
    AND p_event_time IS NOT NULL
    AND (
      -- Check for time overlap (assuming 8-hour event duration)
      e.event_time <= p_event_time + INTERVAL '8 hours'
      AND p_event_time <= e.event_time + INTERVAL '8 hours'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_staff_conflicts(UUID, UUID, DATE, TIME) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION check_staff_conflicts IS 'Checks for scheduling conflicts when assigning staff to events. Returns list of conflicts with type, start/end times, and details. Uses SECURITY DEFINER with explicit search_path for security. Works with web ERP "events" table.';
