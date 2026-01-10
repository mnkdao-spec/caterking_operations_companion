-- Add client_id column to kds_events table to link events with clients

ALTER TABLE kds_events
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for faster client lookups
CREATE INDEX IF NOT EXISTS idx_kds_events_client_id ON kds_events(client_id);

-- Update existing events to link with clients based on matching names (if any)
-- This is a best-effort migration for existing data
UPDATE kds_events e
SET client_id = c.id
FROM clients c
WHERE e.client_name = c.company_name
  AND e.client_id IS NULL;

COMMENT ON COLUMN kds_events.client_id IS 'Foreign key reference to the clients table';
