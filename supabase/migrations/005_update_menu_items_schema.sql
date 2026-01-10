-- Migration: Update menu_items table for web ERP functionality
-- This adds columns needed for the Menu Builder in the web ERP application

-- Add new columns to menu_items table
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS dietary_info TEXT,
  ADD COLUMN IF NOT EXISTS cost_per_serving DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_per_serving DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make course_id nullable for standalone menu items (not tied to specific events)
ALTER TABLE menu_items
  ALTER COLUMN course_id DROP NOT NULL;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Add index for availability filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);

-- Update existing rows to have default values
UPDATE menu_items
SET 
  category = 'Entrée',
  prep_time_minutes = 30,
  description = 'No description available',
  cost_per_serving = 0.00,
  price_per_serving = 0.00,
  minimum_order_quantity = 1,
  is_available = true,
  updated_at = NOW()
WHERE category IS NULL;
