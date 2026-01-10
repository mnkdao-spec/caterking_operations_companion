# Database Migration Checklist
## CaterKing Operations Companion

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Purpose:** Standardized process for creating and deploying database migrations

---

## Overview

This document provides a comprehensive checklist and template for all database migrations in the CaterKing Operations Companion project. Following this process prevents schema mismatches, reduces deployment errors, and ensures consistent database evolution.

**Mandatory Use:** All database schema changes MUST follow this checklist before deployment to any environment.

---

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration File Template](#migration-file-template)
3. [Post-Migration Verification](#post-migration-verification)
4. [Rollback Plan](#rollback-plan)
5. [Common Migration Patterns](#common-migration-patterns)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## Pre-Migration Checklist

### Phase 1: Planning

**Before writing any SQL, complete these steps:**

- [ ] **Document Business Requirement**
  - What business problem does this migration solve?
  - Who requested this change?
  - What is the expected outcome?

- [ ] **Review Existing Schema**
  - Read `docs/database_schema.md` for current table structures
  - Check `docs/naming_conventions.md` for field naming rules
  - Review `docs/data_dictionary.md` for enum values and business logic

- [ ] **Identify Affected Components**
  - Which tables will be modified?
  - Which forms need updates?
  - Which API endpoints are affected?
  - Which reports or analytics depend on this data?

- [ ] **Check for Dependencies**
  - Are there foreign key relationships?
  - Are there triggers or functions that reference these tables?
  - Are there indexes that need updating?
  - Are there RLS policies that need adjusting?

### Phase 2: Design

**Design the schema changes:**

- [ ] **Column Naming**
  - All column names use `snake_case`
  - Primary key named `id` (not `{table}_id`)
  - Foreign keys named `{table}_id`
  - Timestamps use `_at` suffix (e.g., `created_at`)
  - Booleans use `is_` or `has_` prefix
  - Counts use `_count` suffix
  - Monetary values include scope (`_per_serving`, `_per_unit`)
  - Units included in name (`_minutes`, `_hours`, `_ounces`)
  - No abbreviations (except `id`, `url`, `html`)

- [ ] **Data Types**
  - Timestamps use `TIMESTAMP WITH TIME ZONE` (TIMESTAMPTZ)
  - Money uses `DECIMAL(10,2)` or `DECIMAL(12,2)`
  - UUIDs for all primary and foreign keys
  - TEXT for variable-length strings
  - VARCHAR(n) only for known max length
  - BOOLEAN for true/false flags
  - INTEGER for whole number counts
  - DECIMAL for fractional quantities

- [ ] **Constraints**
  - NOT NULL only when truly required
  - DEFAULT values set appropriately
  - CHECK constraints for enum-style fields
  - UNIQUE constraints where needed
  - Foreign key ON DELETE behavior specified

- [ ] **Indexes**
  - Index all foreign keys
  - Index frequently queried columns
  - Index columns used in WHERE clauses
  - Index columns used in ORDER BY
  - Consider composite indexes for multi-column queries

- [ ] **Row Level Security**
  - Enable RLS on all new tables
  - Create appropriate policies (or "allow all" for development)
  - Document policy logic in comments

### Phase 3: Form and API Alignment

**Ensure frontend compatibility:**

- [ ] **Form Field Matching**
  - Form field names EXACTLY match database column names
  - Form uses `snake_case` (not camelCase)
  - All required fields have corresponding database columns
  - All database columns have corresponding form fields (or default values)

- [ ] **API Parameter Matching**
  - API parameters match database column names
  - Request body uses `snake_case`
  - Response body uses `snake_case`
  - Data type conversions handled server-side

- [ ] **TypeScript Types**
  - Update TypeScript interfaces to match new schema
  - Add new fields to existing types
  - Update form validation schemas

### Phase 4: Migration File Creation

**Write the migration SQL:**

- [ ] **File Naming**
  - Format: `{number}_{description}.sql`
  - Sequential numbering (001, 002, 003...)
  - Use snake_case for description
  - Be descriptive about purpose

- [ ] **Migration Header**
  - Include migration number
  - Include creation date
  - Include author name
  - Include purpose description
  - Include affected tables list

- [ ] **SQL Quality**
  - Use `IF NOT EXISTS` for idempotency
  - Include comments explaining complex logic
  - Use transactions where appropriate
  - Handle existing data gracefully
  - Set appropriate default values

- [ ] **Rollback Section**
  - Include commented rollback SQL
  - Test rollback before deployment
  - Document rollback risks

### Phase 5: Testing

**Validate the migration:**

- [ ] **Local Testing**
  - Run migration on local development database
  - Verify tables created correctly
  - Check indexes created
  - Verify RLS policies active
  - Test rollback works

- [ ] **Form Testing**
  - Test create operations with new fields
  - Test update operations with new fields
  - Test delete operations still work
  - Verify validation works correctly

- [ ] **API Testing**
  - Test all affected endpoints
  - Verify request/response formats
  - Check error handling
  - Validate data type conversions

- [ ] **Data Integrity**
  - Check foreign key relationships work
  - Verify constraints prevent invalid data
  - Test default values applied correctly
  - Confirm existing data unaffected (or migrated correctly)

### Phase 6: Documentation

**Update project documentation:**

- [ ] **Schema Documentation**
  - Add new tables to `docs/database_schema.md`
  - Document all columns with types and descriptions
  - Add relationship diagrams if needed
  - Document indexes and their purpose

- [ ] **Data Dictionary**
  - Add new enum values to `docs/data_dictionary.md`
  - Document calculated fields if added
  - Update business rules if changed
  - Add validation rules for new fields

- [ ] **Migration History**
  - Update migration history section in `docs/database_schema.md`
  - Document what changed and why
  - Link to related forms and API endpoints

### Phase 7: Code Review

**Peer review requirements:**

- [ ] **Schema Review**
  - Naming conventions followed
  - Data types appropriate
  - Constraints reasonable
  - Indexes optimized

- [ ] **Code Review**
  - Form fields match database
  - API parameters match database
  - TypeScript types updated
  - No hardcoded values

- [ ] **Documentation Review**
  - All docs updated
  - Clear and accurate
  - Examples provided
  - No outdated information

---

## Migration File Template

Use this template for all new migrations:

```sql
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
```

---

## Post-Migration Verification

### Immediate Verification (Run in SQL Editor)

After running the migration, execute these checks:

**1. Table Structure**
```sql
-- Verify table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = '{table_name}';

-- Verify columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '{table_name}'
ORDER BY ordinal_position;
```

**2. Indexes**
```sql
-- Verify indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = '{table_name}';
```

**3. Foreign Keys**
```sql
-- Verify foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = '{table_name}';
```

**4. Row Level Security**
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = '{table_name}';

-- Verify policies exist
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = '{table_name}';
```

**5. Triggers**
```sql
-- Verify triggers created
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = '{table_name}';
```

### Application Verification

**1. Web ERP Testing**

- [ ] Navigate to affected page in web ERP
- [ ] Verify page loads without errors
- [ ] Test create operation with new fields
- [ ] Test update operation with new fields
- [ ] Test delete operation still works
- [ ] Verify data displays correctly
- [ ] Check console for JavaScript errors

**2. Mobile App Testing**

- [ ] Navigate to affected screen in mobile app
- [ ] Verify screen loads without errors
- [ ] Test all CRUD operations
- [ ] Verify data syncs correctly
- [ ] Check for TypeScript errors

**3. API Testing**

- [ ] Test affected endpoints with Postman/curl
- [ ] Verify request format accepted
- [ ] Verify response format correct
- [ ] Check error handling
- [ ] Validate data types

### Performance Verification

**1. Query Performance**
```sql
-- Check query execution plan
EXPLAIN ANALYZE
SELECT * FROM {table}
WHERE {frequently_queried_column} = 'value';

-- Verify indexes being used
-- Look for "Index Scan" not "Seq Scan" in EXPLAIN output
```

**2. Index Usage**
```sql
-- Check if indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = '{table_name}'
ORDER BY idx_scan DESC;
```

### Data Integrity Verification

**1. Check Constraints**
```sql
-- Verify constraints prevent invalid data
-- This should fail:
INSERT INTO {table} ({column}) VALUES ({invalid_value});

-- This should succeed:
INSERT INTO {table} ({column}) VALUES ({valid_value});
```

**2. Foreign Key Integrity**
```sql
-- Verify foreign keys prevent orphaned records
-- This should fail:
INSERT INTO {child_table} ({parent_id}) VALUES ('{non_existent_uuid}');

-- This should succeed:
INSERT INTO {child_table} ({parent_id}) VALUES ('{existing_uuid}');
```

**3. Default Values**
```sql
-- Verify defaults applied
INSERT INTO {table} ({required_column}) VALUES ('test');
SELECT * FROM {table} WHERE {required_column} = 'test';
-- Check that default values populated
```

---

## Rollback Plan

### When to Rollback

**Rollback immediately if:**
- Migration causes application errors
- Data corruption detected
- Performance severely degraded
- Critical functionality broken

**Do NOT rollback if:**
- Minor display issues (fix forward instead)
- Non-critical features affected
- Issue can be resolved with hotfix

### Rollback Procedure

**1. Stop Application Traffic** (if possible)
```bash
# Stop web ERP server
pkill -f "next dev"

# Stop mobile app dev server
pkill -f "expo start"
```

**2. Backup Current State**
```sql
-- Create backup of affected tables
CREATE TABLE {table}_backup AS SELECT * FROM {table};
```

**3. Execute Rollback SQL**
```sql
-- Run the rollback SQL from migration file comments
-- (See ROLLBACK INSTRUCTIONS section in migration template)
```

**4. Verify Rollback**
```sql
-- Verify table structure reverted
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = '{table}';

-- Verify data intact
SELECT COUNT(*) FROM {table};
```

**5. Restart Application**
```bash
# Restart servers
cd /home/ubuntu/caterking_operations_companion/web && pnpm dev > /tmp/web-erp.log 2>&1 &
```

**6. Test Application**
- Verify affected pages load
- Test core functionality
- Check for errors

### Post-Rollback Actions

- [ ] Document what went wrong
- [ ] Identify root cause
- [ ] Fix migration script
- [ ] Re-test locally
- [ ] Schedule re-deployment

---

## Common Migration Patterns

### Pattern 1: Add Column to Existing Table

```sql
-- Add new column with default value
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal';

-- Add comment
COMMENT ON COLUMN events.priority IS 'Event priority: low, normal, high, urgent';

-- Add index if frequently queried
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority);

-- Update RLS policies if needed
-- (No change needed if using "allow all" policy)
```

### Pattern 2: Add Foreign Key Relationship

```sql
-- Add foreign key column
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- Backfill from existing data
UPDATE events
SET venue_id = venues.id
FROM venues
WHERE events.venue_name = venues.name;

-- Add index
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events(venue_id);
```

### Pattern 3: Change Column Type

```sql
-- Create new column with new type
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS prep_time_minutes_new INTEGER;

-- Migrate data
UPDATE menu_items
SET prep_time_minutes_new = CAST(prep_time_minutes AS INTEGER)
WHERE prep_time_minutes IS NOT NULL;

-- Drop old column
ALTER TABLE menu_items
  DROP COLUMN IF EXISTS prep_time_minutes;

-- Rename new column
ALTER TABLE menu_items
  RENAME COLUMN prep_time_minutes_new TO prep_time_minutes;
```

### Pattern 4: Add Enum-Style Field

```sql
-- Add column with default
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Add check constraint for allowed values
ALTER TABLE clients
  ADD CONSTRAINT check_clients_status
  CHECK (status IN ('active', 'inactive', 'archived'));

-- Add index
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Add comment documenting allowed values
COMMENT ON COLUMN clients.status IS 'Client status: active, inactive, archived';
```

### Pattern 5: Add Calculated Field

```sql
-- Add column for calculated value
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0;

-- Create function to calculate value
CREATE OR REPLACE FUNCTION calculate_client_lifetime_value(client_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
  SELECT COALESCE(SUM(budget), 0)
  FROM events
  WHERE client_id = client_uuid
    AND status = 'completed';
$$ LANGUAGE SQL STABLE;

-- Backfill existing data
UPDATE clients
SET lifetime_value = calculate_client_lifetime_value(id);

-- Create trigger to auto-update
CREATE OR REPLACE FUNCTION update_client_lifetime_value()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients
  SET lifetime_value = calculate_client_lifetime_value(NEW.client_id)
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_lifetime_value
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_client_lifetime_value();
```

---

## Troubleshooting Guide

### Issue: Column Not Found Error

**Symptom:** Form submission fails with "column does not exist" error

**Diagnosis:**
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = '{table}' 
  AND column_name = '{column}';
```

**Solution:**
- Verify migration ran successfully
- Check column name spelling (snake_case)
- Ensure form field name matches database column exactly

---

### Issue: Type Mismatch Error

**Symptom:** Form submission fails with "invalid input syntax for type" error

**Diagnosis:**
```sql
-- Check column data type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = '{table}' 
  AND column_name = '{column}';
```

**Solution:**
- Convert string to appropriate type in form submission
- Use `parseInt()` for INTEGER columns
- Use `parseFloat()` for DECIMAL columns
- Use `new Date()` for TIMESTAMP columns

---

### Issue: Constraint Violation

**Symptom:** Form submission fails with "violates check constraint" or "violates not-null constraint"

**Diagnosis:**
```sql
-- Check constraints on table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = '{table}';

-- Check specific constraint definition
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = '{constraint_name}';
```

**Solution:**
- Ensure form provides required fields
- Validate data before submission
- Check allowed enum values
- Verify foreign key references exist

---

### Issue: RLS Policy Blocking Access

**Symptom:** Query returns empty result set or "permission denied" error

**Diagnosis:**
```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = '{table}';

-- Check policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = '{table}';
```

**Solution:**
- Temporarily disable RLS for testing: `ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;`
- Create "allow all" policy for development
- Implement proper user-based policies for production

---

### Issue: Slow Query Performance

**Symptom:** Page loads slowly or times out

**Diagnosis:**
```sql
-- Check query execution plan
EXPLAIN ANALYZE
SELECT * FROM {table}
WHERE {column} = 'value';

-- Look for "Seq Scan" instead of "Index Scan"
```

**Solution:**
- Add index on frequently queried columns
- Use composite indexes for multi-column queries
- Avoid SELECT * (specify columns)
- Add LIMIT clause for large result sets

---

### Issue: Foreign Key Constraint Violation

**Symptom:** Cannot insert/update record due to foreign key error

**Diagnosis:**
```sql
-- Check if referenced record exists
SELECT id FROM {parent_table} WHERE id = '{uuid}';

-- Check foreign key definition
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = '{table}';
```

**Solution:**
- Ensure referenced record exists before insert
- Use ON DELETE SET NULL for optional relationships
- Use ON DELETE CASCADE for dependent records

---

## Quick Reference

### Pre-Migration Checklist Summary

✅ Document business requirement  
✅ Review existing schema docs  
✅ Identify affected components  
✅ Check dependencies  
✅ Follow naming conventions  
✅ Choose appropriate data types  
✅ Set constraints and defaults  
✅ Add indexes  
✅ Enable RLS  
✅ Match form fields to columns  
✅ Match API parameters to columns  
✅ Update TypeScript types  
✅ Name file correctly  
✅ Write migration header  
✅ Include rollback SQL  
✅ Test locally  
✅ Test forms and APIs  
✅ Update documentation  
✅ Get code review  

### Post-Migration Verification Summary

✅ Verify table structure  
✅ Verify indexes created  
✅ Verify foreign keys work  
✅ Verify RLS enabled  
✅ Verify triggers created  
✅ Test web ERP  
✅ Test mobile app  
✅ Test API endpoints  
✅ Check query performance  
✅ Verify data integrity  

---

**Document Maintenance:**
- Update when new migration patterns emerge
- Add troubleshooting cases as encountered
- Refine checklist based on team feedback
- Keep in sync with naming_conventions.md and database_schema.md

---

**End of Migration Checklist**
