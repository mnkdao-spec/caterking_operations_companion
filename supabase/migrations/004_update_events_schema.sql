-- Migration: Update events table to match web ERP form fields
-- This adds columns needed by the web application

-- Add new columns to events table
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS event_time TIME,
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS venue_address TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'wedding',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS budget DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Make old columns nullable since we're transitioning to new schema
ALTER TABLE events 
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN client DROP NOT NULL,
  ALTER COLUMN guest_count DROP NOT NULL,
  ALTER COLUMN venue DROP NOT NULL,
  ALTER COLUMN start_time DROP NOT NULL;

-- Create index on event_date for faster queries
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- Create index on client_id for faster joins
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
