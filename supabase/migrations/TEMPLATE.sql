-- ============================================================================
-- Migration: {number}_{description}
-- Created: {YYYY-MM-DD}
-- Author: {Your Name}
-- Purpose: {Brief description of what this migration does}
--
-- Affected Tables:
--   - {table_name_1}: {what changed}
--   - {table_name_2}: {what changed}
--
-- Dependencies:
--   - {migration_number}: {dependency description}
--
-- Breaking Changes: {Yes/No - describe if yes}
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE CREATION / MODIFICATION
-- ============================================================================

-- Create new table (if applicable)
CREATE TABLE IF NOT EXISTS {table_name} (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Keys
  {parent_table}_id UUID REFERENCES {parent_table}(id) ON DELETE {CASCADE|SET NULL|RESTRICT},
  
  -- Data Columns
  {column_name} {DATA_TYPE} {NOT NULL} {DEFAULT value},
  
  -- Standard Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to existing table (if applicable)
ALTER TABLE {existing_table}
  ADD COLUMN IF NOT EXISTS {column_name} {DATA_TYPE} {DEFAULT value};

-- Modify existing columns (if applicable)
ALTER TABLE {existing_table}
  ALTER COLUMN {column_name} TYPE {NEW_TYPE},
  ALTER COLUMN {column_name} SET DEFAULT {value},
  ALTER COLUMN {column_name} {SET|DROP} NOT NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index foreign keys
CREATE INDEX IF NOT EXISTS idx_{table}_{parent_table}_id 
  ON {table}({parent_table}_id);

-- Index frequently queried columns
CREATE INDEX IF NOT EXISTS idx_{table}_{column} 
  ON {table}({column});

-- Composite indexes for multi-column queries
CREATE INDEX IF NOT EXISTS idx_{table}_{col1}_{col2} 
  ON {table}({col1}, {col2});

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for {table}" 
  ON {table}
  FOR ALL 
  USING (true);

-- TODO: Replace with proper RLS policies before production deployment
-- Example restrictive policy:
-- CREATE POLICY "Users can only see their own data"
--   ON {table}
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_{table}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_{table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION update_{table}_updated_at();

-- ============================================================================
-- DATA MIGRATION (if applicable)
-- ============================================================================

-- Migrate existing data
UPDATE {table}
SET {new_column} = {calculated_value}
WHERE {condition};

-- Backfill default values
UPDATE {table}
SET {column} = {default_value}
WHERE {column} IS NULL;

-- ============================================================================
-- CONSTRAINTS (add after data migration)
-- ============================================================================

-- Add NOT NULL constraints after backfilling
ALTER TABLE {table}
  ALTER COLUMN {column} SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE {table}
  ADD CONSTRAINT check_{table}_{column}
  CHECK ({column} >= 0);

-- Add UNIQUE constraints
ALTER TABLE {table}
  ADD CONSTRAINT unique_{table}_{column}
  UNIQUE ({column});

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE {table} IS '{Business description of table}';
COMMENT ON COLUMN {table}.{column} IS '{Description of column purpose}';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
To rollback this migration, run the following SQL:

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_{table}_updated_at ON {table};
DROP FUNCTION IF EXISTS update_{table}_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_{table}_{column};

-- Drop policies
DROP POLICY IF EXISTS "Enable all access for {table}" ON {table};

-- Disable RLS
ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;

-- Drop columns
ALTER TABLE {table}
  DROP COLUMN IF EXISTS {column_name};

-- Drop table
DROP TABLE IF EXISTS {table} CASCADE;

NOTES:
- Rollback will cause data loss
- Backup database before rollback
- Test rollback on staging first
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
