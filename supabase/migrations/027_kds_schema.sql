-- Migration: Core KDS Schema
-- Implementation Plan Phase 1 Task 1

-- 1. Fired Courses (Groups of items sent to kitchen at once)
CREATE TABLE IF NOT EXISTS fired_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  course_number INT DEFAULT 1,
  course_name TEXT,
  table_number INT,
  guest_count INT,
  fired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'ready', 'served'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Order Items (Individual items within a course)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fired_course_id UUID NOT NULL REFERENCES fired_courses(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  modifications TEXT[],
  station_type TEXT NOT NULL, -- 'grill', 'saute', etc.
  status TEXT DEFAULT 'fired', -- 'fired', 'in_progress', 'ready', 'completed'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE fired_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- 4. RLS Policies
ALTER TABLE fired_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for fired_courses" ON fired_courses FOR ALL USING (true);
CREATE POLICY "Enable all access for order_items" ON order_items FOR ALL USING (true);

-- 5. Triggers for updated_at
CREATE TRIGGER update_fired_courses_updated_at BEFORE UPDATE ON fired_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
