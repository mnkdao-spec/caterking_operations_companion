---
description: "Database schema changes, migrations, indexes, RLS policies, and PostgreSQL patterns for Supabase"
globs:
  - "supabase/migrations/*.sql"
  - "docs/database_schema.md"
  - "lib/supabase-*.ts"
  - "web/lib/supabase-*.ts"
---

# Database Rules

## Schema Changes

When creating database changes:

1. **Always create migration file** in `supabase/migrations/`
2. **Migration naming:** `{number}_{description}.sql` (e.g., `015_add_invoices.sql`)
3. **Use IF NOT EXISTS** for all CREATE statements
4. **Include rollback** if destructive changes
5. **Update documentation** in `docs/database_schema.md`
6. **Test migrations** on copy of production data first

## Migration Template

```sql
-- Migration {number}: {Description}
-- Purpose: {Why this change is needed}
-- Date: {YYYY-MM-DD}

-- Add new table/column
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (development: allow all)
CREATE POLICY "Enable all access for table_name" 
  ON table_name FOR ALL 
  USING (true);

-- TODO: Replace with proper RLS policies before production
```

## Column Naming

- Use `snake_case` for all columns
- Primary key: always named `id` (UUID type)
- Foreign key: `{table}_id` (UUID type)
- Timestamps: `{action}_at` (TIMESTAMPTZ type)
- Booleans: `is_{property}` prefix
- Include units in numeric field names (`prep_time_minutes`)

## Indexes

- **Index all foreign keys** for join performance
- **Index frequently queried columns** (status, dates)
- **Index columns in WHERE clauses** used frequently
- **Composite indexes** for multi-column queries
- **Naming:** `idx_{table}_{column}`

```sql
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
```

## Row Level Security (RLS)

- **Enable RLS** on all tables
- **Development:** Use permissive policies (`USING (true)`)
- **Production:** Create restrictive policies based on user roles

**Development Policy:**
```sql
CREATE POLICY "Enable all access for events" 
  ON events FOR ALL 
  USING (true);
```

**Note:** Run migrations via Supabase SQL Editor, not via Drizzle CLI (Drizzle is for schema definition only)
