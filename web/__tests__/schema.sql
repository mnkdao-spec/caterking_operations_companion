-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  hourly_rate DECIMAL(10, 2),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  venue_name VARCHAR(255),
  guest_count INTEGER,
  budget DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2),
  price DECIMAL(10, 2),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_assignments table
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, event_id)
);

-- Create invoice_templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  frequency VARCHAR(50), -- 'weekly', 'monthly', 'quarterly', 'annually'
  next_generation_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice_template_items table
CREATE TABLE IF NOT EXISTS invoice_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES invoice_templates(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  event_id UUID REFERENCES events(id),
  template_id UUID REFERENCES invoice_templates(id),
  invoice_number VARCHAR(50) UNIQUE,
  invoice_date DATE,
  due_date DATE,
  subtotal DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  status VARCHAR(50), -- 'draft', 'sent', 'paid', 'overdue'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  total DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_availability table
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  availability_type VARCHAR(50), -- 'time_off', 'unavailable', 'preferred_shift'
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_event_id ON staff_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_client_id ON invoice_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_event_id ON invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_dates ON staff_availability(start_date, end_date);
