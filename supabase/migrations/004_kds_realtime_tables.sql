-- KDS Real-Time Tables Migration
-- Creates tables for real-time KDS synchronization across multiple tablets

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Table: kds_table_groups
-- Stores table group information for the expo (overview) screen
CREATE TABLE IF NOT EXISTS public.kds_table_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 0,
  courses JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, name)
);

-- Table: kds_orders
-- Stores individual order items for station and plating screens
CREATE TABLE IF NOT EXISTS public.kds_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  station_type TEXT NOT NULL CHECK (station_type IN ('grill', 'saute', 'garde', 'dessert', 'plating')),
  menu_item_id UUID,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  table_group TEXT NOT NULL,
  table_number INTEGER NOT NULL,
  modifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  course TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fired', 'in_progress', 'ready', 'completed')),
  fired_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: kds_stations
-- Stores station status and queue information
CREATE TABLE IF NOT EXISTS public.kds_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  station_type TEXT NOT NULL UNIQUE CHECK (station_type IN ('grill', 'saute', 'garde', 'dessert', 'plating')),
  queue_count INTEGER NOT NULL DEFAULT 0,
  oldest_item_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'behind', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, station_type)
);

-- Table: kds_inventory
-- Stores inventory levels for menu items during events
CREATE TABLE IF NOT EXISTS public.kds_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'portions',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'low', 'out_of_stock')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, menu_item_id)
);

-- Table: kds_unprocessed_items
-- Tracks orders that failed to process (for error recovery)
CREATE TABLE IF NOT EXISTS public.kds_unprocessed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.kds_orders(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kds_table_groups_event_id ON public.kds_table_groups(event_id);
CREATE INDEX IF NOT EXISTS idx_kds_table_groups_status ON public.kds_table_groups(status);
CREATE INDEX IF NOT EXISTS idx_kds_orders_event_id ON public.kds_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_kds_orders_station_type ON public.kds_orders(station_type);
CREATE INDEX IF NOT EXISTS idx_kds_orders_status ON public.kds_orders(status);
CREATE INDEX IF NOT EXISTS idx_kds_orders_event_station ON public.kds_orders(event_id, station_type);
CREATE INDEX IF NOT EXISTS idx_kds_stations_event_id ON public.kds_stations(event_id);
CREATE INDEX IF NOT EXISTS idx_kds_inventory_event_id ON public.kds_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_kds_unprocessed_items_event_id ON public.kds_unprocessed_items(event_id);
CREATE INDEX IF NOT EXISTS idx_kds_unprocessed_items_order_id ON public.kds_unprocessed_items(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.kds_table_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kds_unprocessed_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read/write KDS data for their events
-- (Assumes events table has event_users relationship)

CREATE POLICY "kds_table_groups_select" ON public.kds_table_groups
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_table_groups.event_id
    )
  );

CREATE POLICY "kds_table_groups_insert" ON public.kds_table_groups
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_table_groups.event_id
    )
  );

CREATE POLICY "kds_table_groups_update" ON public.kds_table_groups
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_table_groups.event_id
    )
  );

CREATE POLICY "kds_orders_select" ON public.kds_orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_orders.event_id
    )
  );

CREATE POLICY "kds_orders_insert" ON public.kds_orders
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_orders.event_id
    )
  );

CREATE POLICY "kds_orders_update" ON public.kds_orders
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_orders.event_id
    )
  );

CREATE POLICY "kds_stations_select" ON public.kds_stations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_stations.event_id
    )
  );

CREATE POLICY "kds_stations_insert" ON public.kds_stations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_stations.event_id
    )
  );

CREATE POLICY "kds_stations_update" ON public.kds_stations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_stations.event_id
    )
  );

CREATE POLICY "kds_inventory_select" ON public.kds_inventory
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_inventory.event_id
    )
  );

CREATE POLICY "kds_inventory_insert" ON public.kds_inventory
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_inventory.event_id
    )
  );

CREATE POLICY "kds_inventory_update" ON public.kds_inventory
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_inventory.event_id
    )
  );

CREATE POLICY "kds_unprocessed_items_select" ON public.kds_unprocessed_items
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_unprocessed_items.event_id
    )
  );

CREATE POLICY "kds_unprocessed_items_insert" ON public.kds_unprocessed_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_unprocessed_items.event_id
    )
  );

CREATE POLICY "kds_unprocessed_items_update" ON public.kds_unprocessed_items
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_unprocessed_items.event_id
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all KDS tables
CREATE TRIGGER update_kds_table_groups_updated_at
  BEFORE UPDATE ON public.kds_table_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kds_orders_updated_at
  BEFORE UPDATE ON public.kds_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kds_stations_updated_at
  BEFORE UPDATE ON public.kds_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kds_inventory_updated_at
  BEFORE UPDATE ON public.kds_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kds_unprocessed_items_updated_at
  BEFORE UPDATE ON public.kds_unprocessed_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
