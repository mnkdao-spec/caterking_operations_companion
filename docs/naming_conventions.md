# Field Naming Convention Standards
## CaterKing Operations Companion

**Document Version:** 1.0  
**Effective Date:** January 9, 2026  
**Maintained By:** Development Team  
**Status:** Active Standard

---

## Purpose

This document establishes mandatory naming conventions for all database columns, form fields, API parameters, and code identifiers in the CaterKing Operations Companion project. Consistent naming prevents schema mismatches, reduces bugs, and improves code maintainability.

**Scope:** All new code and database changes MUST follow these conventions. Existing code should be refactored to comply during routine maintenance.

---

## Core Principles

### 1. Consistency Above All

Use the same name for the same concept everywhere in the stack. If a database column is named `guest_count`, the form field MUST be `guest_count`, the API parameter MUST be `guest_count`, and the TypeScript variable MUST be `guest_count`.

**✅ Correct:**
```typescript
// Database column: guest_count
// Form field
<input name="guest_count" />
// API parameter
const { guest_count } = req.body;
// TypeScript variable
const guestCount = formData.guest_count;
```

**❌ Incorrect:**
```typescript
// Database column: guest_count
// Form field
<input name="guestCount" />  // Wrong: camelCase
// API parameter
const { totalGuests } = req.body;  // Wrong: different name
```

### 2. Explicit Over Implicit

Field names should be self-documenting. Avoid abbreviations and ambiguous names. Prefer `preparation_time_minutes` over `prep_time` or `duration`.

**✅ Correct:**
- `cost_per_serving` (clear unit and scope)
- `event_date` (clear what date)
- `is_available` (clear boolean)

**❌ Incorrect:**
- `cost` (per what? total? per unit?)
- `date` (which date? start? end? created?)
- `available` (missing `is_` prefix for boolean)

### 3. snake_case for Database, camelCase for TypeScript

Database columns and form fields use `snake_case`. TypeScript/JavaScript variables use `camelCase`. This distinction helps identify data layer vs. application layer.

**✅ Correct:**
```typescript
// Database/Form: snake_case
const formData = { guest_count: 150, event_date: "2026-02-14" };

// TypeScript: camelCase
const guestCount = formData.guest_count;
const eventDate = new Date(formData.event_date);
```

---

## Database Column Naming

### General Rules

**Format:** `{descriptor}_{noun}` or `{noun}_{qualifier}`

**Rules:**
1. Use `snake_case` (all lowercase with underscores)
2. Use full words, not abbreviations (except universally understood: `id`, `url`, `html`)
3. Avoid redundant table name prefix (❌ `event_event_date`, ✅ `event_date`)
4. Be specific about units and scope

### Primary Keys

**Format:** `id`

**Type:** `UUID PRIMARY KEY DEFAULT uuid_generate_v4()` or `gen_random_uuid()`

**Rules:**
- Always named `id` (never `event_id` for primary key)
- Always UUID type for distributed system compatibility
- Always auto-generated

**Examples:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
```

### Foreign Keys

**Format:** `{referenced_table}_id`

**Type:** `UUID`

**Rules:**
- Always singular table name + `_id`
- Always references `{table}.id`
- Always include `ON DELETE` behavior

**Examples:**
```sql
client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
event_id UUID REFERENCES events(id) ON DELETE CASCADE,
menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE
```

### Timestamps

**Format:** `{action}_at` or `{descriptor}_at`

**Type:** `TIMESTAMP WITH TIME ZONE` (TIMESTAMPTZ)

**Rules:**
- Always use `_at` suffix
- Always include timezone (TIMESTAMPTZ)
- Use past tense for action timestamps
- Always default to `NOW()` for creation timestamps

**Standard Timestamps:**
- `created_at` - When record was created (always present)
- `updated_at` - When record was last updated (always present)
- `deleted_at` - Soft delete timestamp (optional)

**Action Timestamps:**
- `fired_at` - When course was fired to kitchen
- `bumped_at` - When chef marked order complete
- `served_at` - When course was served to guests
- `acknowledged_at` - When alert was acknowledged
- `check_in_time` - When staff checked in (exception: uses `_time` for consistency with domain language)
- `check_out_time` - When staff checked out

**Examples:**
```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
fired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
served_at TIMESTAMP WITH TIME ZONE
```

### Dates and Times

**Date Only:** `{descriptor}_date` (TYPE: DATE)
**Time Only:** `{descriptor}_time` (TYPE: TIME)
**Date + Time:** `{descriptor}_at` (TYPE: TIMESTAMPTZ)

**Examples:**
```sql
event_date DATE,           -- Just the date
event_time TIME,           -- Just the time
hire_date DATE,            -- Just the date
start_time TIMESTAMPTZ     -- Full timestamp (legacy naming)
```

**Note:** Prefer separating date and time into two columns for user-friendly forms. Combine in application logic when needed.

### Boolean Flags

**Format:** `is_{property}` or `has_{property}`

**Type:** `BOOLEAN`

**Rules:**
- Always prefix with `is_` or `has_`
- Always default to `true` or `false` (never NULL)
- Use positive phrasing (❌ `is_not_available`, ✅ `is_available`)

**Examples:**
```sql
is_available BOOLEAN DEFAULT true,
is_active BOOLEAN DEFAULT true,
has_dietary_restrictions BOOLEAN DEFAULT false,
acknowledged BOOLEAN DEFAULT false  -- Exception: domain-specific term
```

### Counts and Quantities

**Format:** `{noun}_count` or `total_{noun}`

**Type:** `INTEGER` or `DECIMAL(12,2)` (for fractional quantities)

**Rules:**
- Use `_count` for whole number counts
- Use `total_` prefix for cumulative sums
- Specify unit in name if not obvious

**Examples:**
```sql
guest_count INTEGER,
total_events INTEGER DEFAULT 0,
total_hours_worked DECIMAL(10,2) DEFAULT 0,
quantity DECIMAL(12,2) NOT NULL  -- Context makes unit clear
```

### Monetary Values

**Format:** `{descriptor}_{per_unit}` or `{descriptor}_value`

**Type:** `DECIMAL(10,2)` or `DECIMAL(12,2)`

**Rules:**
- Always use DECIMAL, never FLOAT (precision matters for money)
- Always specify scope (`per_serving`, `per_unit`, `total`, etc.)
- Precision: (10,2) for prices, (12,2) for totals

**Examples:**
```sql
cost_per_serving DECIMAL(10,2),
price_per_serving DECIMAL(10,2),
cost_per_unit DECIMAL(10,2),
hourly_rate DECIMAL(10,2),
budget DECIMAL(10,2),
lifetime_value DECIMAL(12,2),
pay_amount DECIMAL(10,2)
```

### Rates and Measurements

**Format:** `{property}_per_{unit}` or `{property}_{unit}`

**Rules:**
- Always include unit in name
- Use explicit unit names (`minutes`, `hours`, `pounds`, `ounces`)

**Examples:**
```sql
prep_time_minutes INTEGER,
hours_worked DECIMAL(5,2),
cost_per_unit DECIMAL(10,2),
reorder_level DECIMAL(12,2)  -- Unit specified in separate column
```

### Text Fields

**Short Text:** `VARCHAR(n)` with appropriate length
**Long Text:** `TEXT` for unlimited length

**Rules:**
- Use VARCHAR for fields with known max length (email, phone, name)
- Use TEXT for variable-length content (notes, descriptions, addresses)
- Choose reasonable VARCHAR limits (email: 255, phone: 50, name: 100)

**Examples:**
```sql
name VARCHAR(255) NOT NULL,
email VARCHAR(255),
phone VARCHAR(50),
notes TEXT,
description TEXT,
address TEXT
```

### Enum-Style Fields

**Format:** `{property}_type` or `{property}_status` or `{property}`

**Type:** `TEXT` or `VARCHAR(50)`

**Rules:**
- Use TEXT or VARCHAR, not ENUM type (PostgreSQL ENUM is inflexible)
- Document allowed values in comments or CHECK constraints
- Use lowercase with underscores for values

**Examples:**
```sql
event_type TEXT DEFAULT 'wedding',  -- 'wedding', 'corporate', 'private'
status TEXT DEFAULT 'lead',  -- 'lead', 'confirmed', 'completed', 'cancelled'
client_type VARCHAR(50) DEFAULT 'individual',  -- 'individual', 'corporate', 'government'
station TEXT,  -- 'grill', 'saute', 'garde_manger', 'dessert'
```

### Arrays

**Format:** `{noun}s` (plural)

**Type:** `TEXT[]` or appropriate array type

**Rules:**
- Use plural form for array columns
- Document expected array element format

**Examples:**
```sql
table_numbers TEXT[],  -- ['1', '2', '3', '4']
modifications TEXT[],  -- ['no onions', 'extra sauce']
specialties TEXT[]     -- ['pastry', 'grilling', 'sauces']
```

### JSON Fields

**Format:** `{property}` (no special suffix)

**Type:** `JSONB` (prefer JSONB over JSON for indexing)

**Rules:**
- Use JSONB for structured data with flexible schema
- Document expected JSON structure in comments

**Examples:**
```sql
availability JSONB,  -- Weekly availability schedule
metadata JSONB       -- Flexible key-value pairs
```

---

## Form Field Naming

### General Rules

Form fields MUST exactly match database column names to prevent mapping errors.

**✅ Correct:**
```tsx
// Database column: guest_count
<input 
  name="guest_count"
  value={formData.guest_count}
  onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
/>
```

**❌ Incorrect:**
```tsx
// Database column: guest_count
<input 
  name="guestCount"  // Wrong: doesn't match database
  value={formData.guestCount}
/>
```

### Form Data Objects

Use `snake_case` keys matching database columns:

```typescript
const [formData, setFormData] = useState({
  event_name: "",
  event_date: "",
  event_time: "",
  guest_count: "",
  venue_name: "",
  venue_address: "",
  budget: "",
  notes: ""
});
```

### Data Transformation

Convert strings to appropriate types before submission:

```typescript
const dataToSubmit = {
  ...formData,
  guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
  budget: formData.budget ? parseFloat(formData.budget) : null,
};
```

---

## API Parameter Naming

### Request Body Parameters

**Format:** `snake_case` matching database columns

**Rules:**
- Use same names as database columns
- Accept both string and typed values (convert server-side)

**Example:**
```typescript
// POST /api/events
{
  "event_name": "Smith Wedding",
  "event_date": "2026-02-14",
  "guest_count": 150,
  "budget": 25000.00
}
```

### Query Parameters

**Format:** `snake_case` for consistency

**Examples:**
```
GET /api/events?status=confirmed&event_date=2026-02-14
GET /api/menu-items?category=entree&is_available=true
GET /api/staff?role=chef&status=active
```

### URL Path Parameters

**Format:** `kebab-case` for URLs, but reference by `snake_case` in code

**Examples:**
```
GET /api/events/:event_id
GET /api/clients/:client_id
GET /api/menu-items/:menu_item_id
```

---

## TypeScript/JavaScript Naming

### Variables

**Format:** `camelCase`

**Rules:**
- Use camelCase for all variables
- Convert from snake_case when reading from database/forms
- Convert to snake_case when writing to database/forms

**Examples:**
```typescript
const guestCount = formData.guest_count;
const eventDate = new Date(formData.event_date);
const isAvailable = menuItem.is_available;
```

### Constants

**Format:** `SCREAMING_SNAKE_CASE`

**Examples:**
```typescript
const MAX_GUEST_COUNT = 500;
const DEFAULT_EVENT_TYPE = 'wedding';
const API_BASE_URL = 'https://api.example.com';
```

### Functions

**Format:** `camelCase` with verb prefix

**Examples:**
```typescript
function getEvents() { }
function createEvent() { }
function updateEventStatus() { }
function deleteMenuItem() { }
```

### React Components

**Format:** `PascalCase`

**Examples:**
```typescript
function EventForm() { }
function ClientList() { }
function MenuItemCard() { }
```

### Interfaces/Types

**Format:** `PascalCase` with descriptive suffix

**Examples:**
```typescript
interface EventFormProps { }
interface ClientData { }
type EventStatus = 'lead' | 'confirmed' | 'completed' | 'cancelled';
```

---

## File Naming

### Database Migrations

**Format:** `{number}_{description}.sql`

**Rules:**
- Sequential numbering: 001, 002, 003...
- Use snake_case for description
- Be descriptive about purpose

**Examples:**
```
001_kds_schema.sql
002_inventory_schema.sql
003_clients_staff_schema.sql
004_update_events_schema.sql
005_update_menu_items_schema.sql
```

### React Components

**Format:** `{component-name}.tsx` (kebab-case)

**Examples:**
```
event-form.tsx
client-list.tsx
menu-item-card.tsx
staff-assignment-table.tsx
```

### Utility Files

**Format:** `{purpose}.ts` (kebab-case)

**Examples:**
```
supabase-services.ts
date-utils.ts
format-currency.ts
```

---

## Common Patterns Reference

### Table: Standard Column Patterns

| Pattern | Format | Type | Example |
|---------|--------|------|---------|
| Primary Key | `id` | UUID | `id UUID PRIMARY KEY` |
| Foreign Key | `{table}_id` | UUID | `client_id UUID` |
| Name | `{descriptor}_name` | VARCHAR | `event_name VARCHAR(255)` |
| Created | `created_at` | TIMESTAMPTZ | `created_at TIMESTAMPTZ DEFAULT NOW()` |
| Updated | `updated_at` | TIMESTAMPTZ | `updated_at TIMESTAMPTZ DEFAULT NOW()` |
| Boolean | `is_{property}` | BOOLEAN | `is_available BOOLEAN DEFAULT true` |
| Count | `{noun}_count` | INTEGER | `guest_count INTEGER` |
| Total | `total_{noun}` | INTEGER/DECIMAL | `total_events INTEGER` |
| Money | `{descriptor}_per_{unit}` | DECIMAL(10,2) | `cost_per_serving DECIMAL(10,2)` |
| Time Duration | `{property}_{unit}` | INTEGER | `prep_time_minutes INTEGER` |
| Status | `status` | TEXT | `status TEXT DEFAULT 'active'` |
| Type | `{property}_type` | TEXT | `event_type TEXT` |
| Date | `{descriptor}_date` | DATE | `event_date DATE` |
| Time | `{descriptor}_time` | TIME | `event_time TIME` |
| Timestamp | `{action}_at` | TIMESTAMPTZ | `fired_at TIMESTAMPTZ` |
| Array | `{noun}s` | TEXT[] | `table_numbers TEXT[]` |
| JSON | `{property}` | JSONB | `availability JSONB` |

---

## Anti-Patterns to Avoid

### ❌ Inconsistent Naming

**Problem:** Same concept with different names across stack

```typescript
// ❌ BAD
// Database: guest_count
// Form: numberOfGuests
// API: totalGuests
// Variable: guestCount
```

**Solution:** Use `guest_count` everywhere (except TypeScript variables use `guestCount`)

### ❌ Ambiguous Names

**Problem:** Unclear what the field represents

```sql
-- ❌ BAD
date DATE,           -- Which date?
time TIME,           -- Which time?
cost DECIMAL,        -- Cost per what?
count INTEGER        -- Count of what?
```

**Solution:** Be specific

```sql
-- ✅ GOOD
event_date DATE,
event_time TIME,
cost_per_serving DECIMAL(10,2),
guest_count INTEGER
```

### ❌ Abbreviations

**Problem:** Unclear abbreviations

```sql
-- ❌ BAD
prep_tm INT,         -- prep time? prep team?
qty DECIMAL,         -- quantity
addr TEXT,           -- address
desc TEXT            -- description? descending?
```

**Solution:** Use full words

```sql
-- ✅ GOOD
prep_time_minutes INTEGER,
quantity DECIMAL(12,2),
address TEXT,
description TEXT
```

### ❌ Redundant Table Prefix

**Problem:** Table name repeated in column name

```sql
-- ❌ BAD
CREATE TABLE events (
  event_id UUID,           -- Redundant
  event_event_name TEXT,   -- Very redundant
  event_date DATE
);
```

**Solution:** Omit table name from columns

```sql
-- ✅ GOOD
CREATE TABLE events (
  id UUID,
  event_name TEXT,
  event_date DATE
);
```

### ❌ Missing Units

**Problem:** Numeric fields without units

```sql
-- ❌ BAD
prep_time INTEGER,       -- Minutes? Hours? Seconds?
weight DECIMAL,          -- Pounds? Ounces? Kilograms?
distance DECIMAL         -- Miles? Kilometers? Meters?
```

**Solution:** Include unit in name

```sql
-- ✅ GOOD
prep_time_minutes INTEGER,
weight_ounces DECIMAL(10,2),
distance_miles DECIMAL(10,2)
```

### ❌ Boolean Without is_/has_ Prefix

**Problem:** Boolean fields that look like strings

```sql
-- ❌ BAD
available BOOLEAN,       -- Looks like a string
active BOOLEAN,          -- Looks like a string
deleted BOOLEAN          -- Looks like a string
```

**Solution:** Use is_/has_ prefix

```sql
-- ✅ GOOD
is_available BOOLEAN,
is_active BOOLEAN,
is_deleted BOOLEAN  -- Or use deleted_at TIMESTAMPTZ for soft deletes
```

---

## Migration Checklist

When creating new tables or columns, verify:

- [ ] All column names use `snake_case`
- [ ] Primary key named `id` (not `{table}_id`)
- [ ] Foreign keys named `{table}_id`
- [ ] Timestamps use `_at` suffix and TIMESTAMPTZ type
- [ ] Booleans use `is_` or `has_` prefix
- [ ] Counts use `_count` suffix
- [ ] Monetary values use DECIMAL type with scope (`_per_serving`, etc.)
- [ ] Units included in name for measurements (`_minutes`, `_hours`, etc.)
- [ ] No abbreviations (except `id`, `url`, `html`)
- [ ] No redundant table name prefix
- [ ] `created_at` and `updated_at` included
- [ ] Form fields match database column names exactly
- [ ] API parameters match database column names exactly

---

## Enforcement

### Code Review Requirements

All pull requests MUST be reviewed for naming convention compliance:

1. **Database Changes:** Verify all new columns follow conventions
2. **Form Fields:** Verify field names match database columns
3. **API Parameters:** Verify parameter names match database columns
4. **TypeScript:** Verify camelCase for variables, snake_case for data objects

### Automated Checks

Consider implementing:

- **Linter Rules:** Enforce camelCase/snake_case in appropriate contexts
- **Migration Validator:** Check column names against conventions
- **Type Generator:** Auto-generate TypeScript types from database schema

### Refactoring Legacy Code

When touching legacy code:

1. Check if field names follow conventions
2. If not, refactor to comply (if low risk)
3. If high risk, document deviation and plan future refactor
4. Never mix old and new conventions in same file

---

## Examples from CaterKing Schema

### ✅ Good Examples

```sql
-- events table
event_name TEXT,                    -- Clear, specific
event_date DATE,                    -- Clear, includes type
guest_count INTEGER,                -- Clear, includes count
is_available BOOLEAN,               -- Clear boolean
created_at TIMESTAMPTZ,             -- Standard timestamp
client_id UUID                      -- Standard FK

-- menu_items table
prep_time_minutes INTEGER,          -- Includes unit
cost_per_serving DECIMAL(10,2),     -- Includes scope
minimum_order_quantity INTEGER,     -- Full words, clear meaning

-- staff table
first_name VARCHAR(100),            -- Clear, specific
hourly_rate DECIMAL(10,2),          -- Clear rate
total_hours_worked DECIMAL(10,2),   -- Clear cumulative
performance_rating DECIMAL(3,2)     -- Clear metric
```

### ⚠️ Legacy Exceptions

These exist for backward compatibility but should not be used in new code:

```sql
-- events table (legacy KDS fields)
name TEXT,                  -- Should be event_name
client TEXT,                -- Should be client_name or client_id
venue TEXT,                 -- Should be venue_name
start_time TIMESTAMPTZ      -- Should be started_at or separate date/time

-- staff_assignments table
check_in_time TIMESTAMPTZ,  -- Should be checked_in_at
check_out_time TIMESTAMPTZ  -- Should be checked_out_at
```

---

## Quick Reference Card

### Database Columns

| Element | Convention | Example |
|---------|-----------|---------|
| Case | snake_case | `guest_count` |
| Primary Key | `id` | `id UUID PRIMARY KEY` |
| Foreign Key | `{table}_id` | `event_id UUID` |
| Boolean | `is_{property}` | `is_available BOOLEAN` |
| Timestamp | `{action}_at` | `created_at TIMESTAMPTZ` |
| Count | `{noun}_count` | `guest_count INTEGER` |
| Money | `{scope}_per_{unit}` | `cost_per_serving DECIMAL` |

### Form Fields

| Element | Convention | Example |
|---------|-----------|---------|
| Case | snake_case | `guest_count` |
| Match | Exact database match | `name="guest_count"` |

### TypeScript

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `const guestCount = ...` |
| Constants | SCREAMING_SNAKE_CASE | `const MAX_GUESTS = 500` |
| Functions | camelCase | `function getEvents()` |
| Components | PascalCase | `function EventForm()` |
| Types | PascalCase | `interface EventData` |

### Files

| Element | Convention | Example |
|---------|-----------|---------|
| Migrations | `{num}_{desc}.sql` | `001_kds_schema.sql` |
| Components | kebab-case.tsx | `event-form.tsx` |
| Utilities | kebab-case.ts | `date-utils.ts` |

---

**Document Maintenance:**
- Review and update when new patterns emerge
- Add examples from actual code
- Remove anti-patterns as legacy code is refactored
- Coordinate with database_schema.md for consistency

---

**End of Naming Convention Standards**
