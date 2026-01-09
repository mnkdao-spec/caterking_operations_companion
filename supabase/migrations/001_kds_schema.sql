-- CaterKing KDS Database Schema
-- This migration creates tables for real-time kitchen display system synchronization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  venue TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table (e.g., Appetizers, Salads, Main Course, Dessert)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  course_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, course_number)
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  station TEXT NOT NULL, -- 'grill', 'saute', 'garde_manger', 'dessert'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table groups (e.g., Tables 1-4, Tables 5-8)
CREATE TABLE IF NOT EXISTS table_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  table_numbers TEXT[] NOT NULL, -- Array of table numbers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fired courses (when a course is "fired" for a table group)
CREATE TABLE IF NOT EXISTS fired_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  table_group_id UUID NOT NULL REFERENCES table_groups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'fired', -- 'fired', 'in_progress', 'ready', 'served'
  fired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  served_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items (individual dishes that need to be prepared)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fired_course_id UUID NOT NULL REFERENCES fired_courses(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  station TEXT NOT NULL, -- Denormalized for quick filtering
  modifications TEXT[] DEFAULT '{}', -- Array of special requests
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'cooking', 'done'
  fired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bumped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_courses_event_id ON courses(event_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_course_id ON menu_items(course_id);
CREATE INDEX IF NOT EXISTS idx_table_groups_event_id ON table_groups(event_id);
CREATE INDEX IF NOT EXISTS idx_fired_courses_event_id ON fired_courses(event_id);
CREATE INDEX IF NOT EXISTS idx_fired_courses_status ON fired_courses(status);
CREATE INDEX IF NOT EXISTS idx_order_items_fired_course_id ON order_items(fired_course_id);
CREATE INDEX IF NOT EXISTS idx_order_items_station ON order_items(station);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE fired_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, restrict later based on auth)
CREATE POLICY "Enable all access for events" ON events FOR ALL USING (true);
CREATE POLICY "Enable all access for courses" ON courses FOR ALL USING (true);
CREATE POLICY "Enable all access for menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Enable all access for table_groups" ON table_groups FOR ALL USING (true);
CREATE POLICY "Enable all access for fired_courses" ON fired_courses FOR ALL USING (true);
CREATE POLICY "Enable all access for order_items" ON order_items FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fired_courses_updated_at BEFORE UPDATE ON fired_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
