-- Migration 003: Clients and Staff Tables
-- This migration creates tables for managing clients and staff members

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  contact_person VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  client_type VARCHAR(50) DEFAULT 'individual', -- individual, corporate, government
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Events History (for tracking relationship)
CREATE TABLE IF NOT EXISTS client_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID, -- Will add FK constraint later if kds_events table exists
  event_date TIMESTAMPTZ NOT NULL,
  revenue DECIMAL(12, 2),
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(100) NOT NULL, -- chef, sous_chef, line_cook, server, bartender, manager, etc.
  department VARCHAR(100), -- kitchen, service, management, admin
  status VARCHAR(50) DEFAULT 'active', -- active, on_leave, inactive
  hire_date DATE,
  hourly_rate DECIMAL(10, 2),
  certification_level VARCHAR(50), -- junior, intermediate, senior, master
  specialties TEXT[], -- Array of specialties (e.g., ['pastry', 'grilling', 'sauces'])
  availability JSONB, -- Store weekly availability as JSON
  total_hours_worked DECIMAL(10, 2) DEFAULT 0,
  total_events_worked INTEGER DEFAULT 0,
  performance_rating DECIMAL(3, 2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Assignments (link staff to events)
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  event_id UUID, -- Will add FK constraint later if kds_events table exists
  role VARCHAR(100) NOT NULL, -- Role for this specific event
  hours_worked DECIMAL(5, 2),
  pay_amount DECIMAL(10, 2),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_client_events_client_id ON client_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_events_event_id ON client_events(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_event_id ON staff_assignments(event_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO clients (name, email, phone, company, client_type, status, satisfaction_rating, lifetime_value, total_events) VALUES
  ('Acme Corporation', 'events@acmecorp.com', '555-0100', 'Acme Corp', 'corporate', 'active', 5, 125000, 8),
  ('Emily Smith', 'emily.smith@email.com', '555-0101', NULL, 'individual', 'active', 5, 28000, 1),
  ('TechStart Inc', 'contact@techstart.com', '555-0102', 'TechStart', 'corporate', 'active', 4, 95000, 6),
  ('Global Events LLC', 'info@globalevents.com', '555-0103', 'Global Events', 'corporate', 'active', 4, 78000, 5),
  ('Johnson Wedding', 'mjohnson@email.com', '555-0104', NULL, 'individual', 'active', 5, 32000, 1),
  ('City Hospital Foundation', 'foundation@cityhospital.org', '555-0105', 'City Hospital', 'government', 'active', 5, 145000, 10)
ON CONFLICT DO NOTHING;

INSERT INTO staff (first_name, last_name, email, phone, role, department, status, hire_date, hourly_rate, certification_level, specialties, total_hours_worked, total_events_worked, performance_rating) VALUES
  ('Marcus', 'Chen', 'marcus.chen@caterking.com', '555-1001', 'Executive Chef', 'kitchen', 'active', '2020-03-15', 45.00, 'master', ARRAY['fine_dining', 'french', 'molecular'], 3200, 145, 4.9),
  ('Sarah', 'Williams', 'sarah.w@caterking.com', '555-1002', 'Sous Chef', 'kitchen', 'active', '2021-06-01', 32.00, 'senior', ARRAY['pastry', 'desserts', 'plating'], 2800, 120, 4.7),
  ('James', 'Rodriguez', 'james.r@caterking.com', '555-1003', 'Line Cook', 'kitchen', 'active', '2022-01-10', 22.00, 'intermediate', ARRAY['grilling', 'sauces', 'proteins'], 2100, 95, 4.5),
  ('Lisa', 'Thompson', 'lisa.t@caterking.com', '555-1004', 'Event Manager', 'management', 'active', '2019-11-20', 38.00, 'senior', ARRAY['coordination', 'client_relations'], 3500, 160, 4.8),
  ('David', 'Park', 'david.p@caterking.com', '555-1005', 'Head Server', 'service', 'active', '2021-08-15', 25.00, 'senior', ARRAY['service', 'wine', 'presentation'], 2600, 115, 4.6),
  ('Maria', 'Garcia', 'maria.g@caterking.com', '555-1006', 'Server', 'service', 'active', '2023-02-01', 18.00, 'intermediate', ARRAY['service', 'hospitality'], 1400, 65, 4.4),
  ('Alex', 'Kim', 'alex.k@caterking.com', '555-1007', 'Bartender', 'service', 'active', '2022-05-10', 24.00, 'intermediate', ARRAY['mixology', 'cocktails', 'wine'], 1800, 80, 4.5),
  ('Rachel', 'Brown', 'rachel.b@caterking.com', '555-1008', 'Prep Cook', 'kitchen', 'active', '2023-07-01', 19.00, 'junior', ARRAY['prep', 'vegetables', 'stocks'], 950, 42, 4.2)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE clients IS 'Stores client information for CRM and event management';
COMMENT ON TABLE client_events IS 'Tracks the relationship between clients and their events';
COMMENT ON TABLE staff IS 'Stores staff member information including roles, rates, and performance';
COMMENT ON TABLE staff_assignments IS 'Links staff members to specific events with hours and pay tracking';
