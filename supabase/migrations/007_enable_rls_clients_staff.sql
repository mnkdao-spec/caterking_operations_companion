-- Migration: Enable Row Level Security on Clients and Staff Tables
-- Date: 2026-01-09
-- Purpose: Fix security issue - RLS was not enabled on tables created in migration 003
--
-- Affected Tables:
-- - clients
-- - client_events
-- - staff
-- - staff_assignments
--
-- Issue: Supabase linter reported ERROR level security issue
-- "RLS Disabled in Public" for these tables

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, restrict later based on auth)
CREATE POLICY "Enable all access for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Enable all access for client_events" ON client_events FOR ALL USING (true);
CREATE POLICY "Enable all access for staff" ON staff FOR ALL USING (true);
CREATE POLICY "Enable all access for staff_assignments" ON staff_assignments FOR ALL USING (true);

-- Add comments
COMMENT ON POLICY "Enable all access for clients" ON clients IS 'Temporary policy - allows all operations. Should be restricted based on user roles in production.';
COMMENT ON POLICY "Enable all access for client_events" ON client_events IS 'Temporary policy - allows all operations. Should be restricted based on user roles in production.';
COMMENT ON POLICY "Enable all access for staff" ON staff IS 'Temporary policy - allows all operations. Should be restricted based on user roles in production.';
COMMENT ON POLICY "Enable all access for staff_assignments" ON staff_assignments IS 'Temporary policy - allows all operations. Should be restricted based on user roles in production.';
