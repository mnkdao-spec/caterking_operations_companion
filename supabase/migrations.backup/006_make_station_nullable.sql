-- Migration: Make station column nullable in menu_items table
-- This allows web ERP menu items to exist without being tied to specific kitchen stations

-- Make station column nullable
ALTER TABLE menu_items
  ALTER COLUMN station DROP NOT NULL;

-- Add a comment explaining the nullable station
COMMENT ON COLUMN menu_items.station IS 'Kitchen station (grill, saute, garde_manger, dessert). NULL for general menu items not yet assigned to a station.';
