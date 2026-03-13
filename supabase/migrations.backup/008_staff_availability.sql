-- Migration: 008_staff_availability
-- Description: Add staff_availability table for tracking time-off, unavailable periods, and schedule conflicts
-- Author: AI Agent
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: staff_availability
-- Purpose: Track when staff members are unavailable (time-off, sick days, conflicts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL, -- 'time_off', 'sick_day', 'personal', 'conflict', 'other'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_reason CHECK (reason IN ('time_off', 'sick_day', 'personal', 'conflict', 'other'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_time_range ON staff_availability(start_time, end_time);
CREATE INDEX idx_staff_availability_reason ON staff_availability(reason);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for staff_availability" 
  ON staff_availability 
  FOR ALL 
  USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if a staff member has any conflicts during a time period
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
  RETURN QUERY
  SELECT 
    'double_booking'::TEXT as conflict_type,
    e.event_date as conflict_start,
    e.event_date + INTERVAL '1 hour' * COALESCE(sta.hours_assigned, 4) as conflict_end,
    CONCAT('Already assigned to: ', e.event_name) as conflict_details
  FROM staff_assignments sta
  JOIN events e ON sta.event_id = e.id
  WHERE sta.staff_id = p_staff_id
    AND e.event_date < p_end_time
    AND (e.event_date + INTERVAL '1 hour' * COALESCE(sta.hours_assigned, 4)) > p_start_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE staff_availability IS 'Tracks when staff members are unavailable due to time-off, sick days, or other reasons';
COMMENT ON COLUMN staff_availability.reason IS 'Type of unavailability: time_off, sick_day, personal, conflict, other';
COMMENT ON FUNCTION check_staff_conflicts IS 'Returns all scheduling conflicts for a staff member during a given time period';

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- To rollback this migration, run:
-- DROP FUNCTION IF EXISTS check_staff_conflicts(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
-- DROP TABLE IF EXISTS staff_availability CASCADE;
