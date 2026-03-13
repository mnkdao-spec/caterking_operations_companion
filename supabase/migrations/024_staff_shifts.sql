-- Migration: Staff Shifts and Time Tracking
-- Implementation Plan Phase 1 Task 1

-- Create staff_shifts table
CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  clock_in TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(10, 2) DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2) NOT NULL, -- Captured at time of shift
  total_pay NUMERIC(15, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_event_id ON staff_shifts(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_clock_in ON staff_shifts(clock_in);

-- Enable RLS
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;

-- Dev policies (allow all)
CREATE POLICY "Enable all access for staff_shifts" ON staff_shifts FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_staff_shifts_updated_at BEFORE UPDATE ON staff_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
