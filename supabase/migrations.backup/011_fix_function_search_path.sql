-- Migration 011: Fix check_staff_conflicts Function Search Path Security Issue
-- Description: Adds proper SECURITY DEFINER and search_path configuration to prevent
--              "Function Search Path Mutable" error in Supabase
-- Date: 2026-01-09
-- Author: Manus AI

-- Drop ALL existing versions of the function (there may be multiple with different signatures)
DROP FUNCTION IF EXISTS check_staff_conflicts(UUID, UUID, DATE, TIME) CASCADE;
DROP FUNCTION IF EXISTS check_staff_conflicts(UUID, UUID, TIMESTAMP, TIMESTAMP) CASCADE;
DROP FUNCTION IF EXISTS check_staff_conflicts CASCADE;

-- Recreate the function with proper security configuration
CREATE OR REPLACE FUNCTION check_staff_conflicts(
  p_staff_id UUID,
  p_event_id UUID,
  p_event_date DATE,
  p_event_time TIME
)
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  event_date DATE,
  event_time TIME,
  role TEXT
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
    e.id AS event_id,
    e.event_name,
    e.event_date,
    e.event_time,
    sa.role
  FROM staff_assignments sa
  INNER JOIN kds_events e ON sa.event_id = e.id
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
COMMENT ON FUNCTION check_staff_conflicts IS 'Checks for scheduling conflicts when assigning staff to events. Returns list of conflicting events for the specified staff member on the given date/time. Uses SECURITY DEFINER with explicit search_path for security.';
