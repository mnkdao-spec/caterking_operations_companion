# Database Schema Audit Report
## CaterKing Operations Companion

**Document Version:** 1.0  
**Audit Date:** January 9, 2026  
**Prepared By:** Manus AI  
**Project:** CaterKing Operations Companion (fullstack 360 catering business app)

---

## Executive Summary

This audit report documents the current state of the CaterKing database schema, inventories all web ERP and mobile KDS forms, and identifies mismatches between form fields and database columns. The audit was conducted as part of Phase 1 of the database migration optimization initiative to prevent future schema-related bugs and improve development efficiency.

**Key Findings:**

- **Total Tables Audited:** 15 tables across 6 migration files
- **Total Forms Audited:** 4 web ERP forms (Events, Clients, Staff, Menu Items)
- **Critical Mismatches Identified:** 6 (all resolved during development)
- **Remaining Issues:** 0 critical, 2 minor recommendations

The audit revealed that recent development work successfully resolved all critical schema mismatches through migrations 004-006. However, opportunities remain to improve schema consistency and documentation to prevent future issues.

---

## Database Tables Inventory

The CaterKing database consists of 15 tables organized across 6 migration files, supporting both the Kitchen Display System (KDS) and the web-based Enterprise Resource Planning (ERP) system.

### Table 1: Database Tables by Migration

| Migration | Table Name | Primary Purpose | Used By | Row Count (Est.) |
|-----------|------------|-----------------|---------|------------------|
| 001 | `events` | Store event information | Both KDS & Web ERP | Variable |
| 001 | `courses` | Event courses (appetizer, main, dessert) | KDS | Variable |
| 001 | `menu_items` | Dishes and recipes | Both KDS & Web ERP | ~50-200 |
| 001 | `table_groups` | Table groupings for service | KDS | Variable |
| 001 | `fired_courses` | Track course firing status | KDS | Variable |
| 001 | `order_items` | Individual dish orders | KDS | Variable |
| 002 | `ingredients` | Ingredient master list | Web ERP | ~100-500 |
| 002 | `stock_levels` | Current inventory levels | Web ERP | Variable |
| 002 | `recipe_ingredients` | Recipe composition | Web ERP | Variable |
| 002 | `inventory_transactions` | Inventory audit trail | Web ERP | Variable |
| 002 | `low_stock_alerts` | Stock alerts | Web ERP | Variable |
| 003 | `clients` | Client CRM data | Web ERP | ~50-500 |
| 003 | `client_events` | Client-event relationships | Web ERP | Variable |
| 003 | `staff` | Staff member information | Web ERP | ~10-50 |
| 003 | `staff_assignments` | Staff-event assignments | Web ERP | Variable |

### Detailed Table Schemas

#### Events Table (Migration 001 + 004)

The `events` table underwent significant schema evolution to support both KDS operations and web ERP management. Migration 004 added web ERP-specific fields while maintaining backward compatibility with the original KDS schema.

**Original Schema (Migration 001):**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `client` (TEXT, NOT NULL)
- `guest_count` (INTEGER, NOT NULL)
- `venue` (TEXT, NOT NULL)
- `start_time` (TIMESTAMPTZ, NOT NULL)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Enhanced Schema (After Migration 004):**
- All original columns (now nullable)
- `event_name` (TEXT) - Display name for web ERP
- `event_date` (DATE) - Separate date field
- `event_time` (TIME) - Separate time field
- `venue_name` (TEXT) - Structured venue name
- `venue_address` (TEXT) - Full venue address
- `event_type` (TEXT) - wedding, corporate, private
- `status` (TEXT) - lead, confirmed, completed, cancelled
- `budget` (DECIMAL) - Event budget
- `notes` (TEXT) - Internal notes
- `client_id` (UUID, FK) - Reference to clients table

**Indexes:**
- `idx_events_start_time` - Original KDS index
- `idx_events_event_date` - Web ERP date queries
- `idx_events_client_id` - Join optimization
- `idx_events_status` - Filtering by status

#### Menu Items Table (Migration 001 + 005 + 006)

The `menu_items` table evolved from a simple KDS dish list to a comprehensive menu management system supporting pricing, dietary information, and availability tracking.

**Original Schema (Migration 001):**
- `id` (UUID, PK)
- `course_id` (UUID, FK, NOT NULL)
- `name` (TEXT, NOT NULL)
- `station` (TEXT, NOT NULL) - grill, saute, garde_manger, dessert
- `created_at` (TIMESTAMPTZ)

**Enhanced Schema (After Migrations 005 + 006):**
- All original columns
- `course_id` (now nullable) - Allows standalone menu items
- `station` (now nullable) - Not required for web ERP items
- `category` (TEXT) - appetizer, entrée, side dish, dessert, beverage
- `prep_time_minutes` (INTEGER) - Preparation time
- `description` (TEXT) - Dish description
- `dietary_info` (TEXT) - Dietary restrictions/info
- `cost_per_serving` (DECIMAL) - Cost to prepare
- `price_per_serving` (DECIMAL) - Customer price
- `minimum_order_quantity` (INTEGER) - Minimum order
- `is_available` (BOOLEAN) - Availability flag
- `updated_at` (TIMESTAMPTZ) - Last update

**Indexes:**
- `idx_menu_items_course_id` - Original KDS index
- `idx_menu_items_category` - Web ERP filtering
- `idx_menu_items_is_available` - Availability queries

#### Clients Table (Migration 003)

The `clients` table supports comprehensive CRM functionality in the web ERP.

**Schema:**
- `id` (UUID, PK)
- `name` (VARCHAR 255, NOT NULL)
- `email` (VARCHAR 255)
- `phone` (VARCHAR 50)
- `company` (VARCHAR 255)
- `contact_person` (VARCHAR 255)
- `address` (TEXT)
- `city` (VARCHAR 100)
- `state` (VARCHAR 50)
- `zip_code` (VARCHAR 20)
- `country` (VARCHAR 100, DEFAULT 'USA')
- `client_type` (VARCHAR 50, DEFAULT 'individual') - individual, corporate, government
- `status` (VARCHAR 50, DEFAULT 'active') - active, inactive, archived
- `satisfaction_rating` (INTEGER, CHECK 1-5)
- `lifetime_value` (DECIMAL)
- `total_events` (INTEGER, DEFAULT 0)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_clients_email` - Email lookups
- `idx_clients_status` - Status filtering
- `idx_clients_type` - Type filtering

#### Staff Table (Migration 003)

The `staff` table manages employee information, scheduling, and performance tracking.

**Schema:**
- `id` (UUID, PK)
- `first_name` (VARCHAR 100, NOT NULL)
- `last_name` (VARCHAR 100, NOT NULL)
- `email` (VARCHAR 255, UNIQUE)
- `phone` (VARCHAR 50)
- `role` (VARCHAR 100, NOT NULL) - chef, sous_chef, line_cook, server, etc.
- `department` (VARCHAR 100) - kitchen, service, management, admin
- `status` (VARCHAR 50, DEFAULT 'active') - active, on_leave, inactive
- `hire_date` (DATE)
- `hourly_rate` (DECIMAL)
- `certification_level` (VARCHAR 50) - junior, intermediate, senior, master
- `specialties` (TEXT[]) - Array of specialties
- `availability` (JSONB) - Weekly availability
- `total_hours_worked` (DECIMAL)
- `total_events_worked` (INTEGER, DEFAULT 0)
- `performance_rating` (DECIMAL, CHECK 0-5)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_staff_email` - Email lookups
- `idx_staff_role` - Role filtering
- `idx_staff_status` - Status filtering

---

## Web ERP Forms Inventory

The web ERP application contains four primary forms for managing events, clients, staff, and menu items. Each form was analyzed to document the exact field names and data types submitted to the database.

### Table 2: Web ERP Forms Summary

| Form | Component File | Fields Count | Data Transformations | Validation |
|------|---------------|--------------|---------------------|------------|
| Event Form | `event-form.tsx` | 10 | Integer, Decimal parsing | Required: event_name |
| Client Form | `client-form.tsx` | 12 | None | Required: name |
| Staff Form | `staff-form.tsx` | 11 | Decimal parsing | Required: first_name, last_name, role |
| Menu Item Form | `menu-item-form.tsx` | 9 | Integer, Decimal parsing | Required: name, category |

### Event Form Fields

**File:** `/web/components/event-form.tsx`

**Form Data Structure:**
```typescript
{
  event_name: string,
  event_date: string,
  event_time: string,
  venue_name: string,
  venue_address: string,
  guest_count: string | number,
  event_type: string,  // Default: "wedding"
  status: string,      // Default: "lead"
  budget: string | number,
  notes: string
}
```

**Data Transformations:**
- `guest_count`: Parsed to integer before submission
- `budget`: Parsed to float before submission
- Both fields nullable (null if empty)

**Validation:**
- `event_name` is required
- All other fields optional

### Client Form Fields

**File:** `/web/components/client-form.tsx`

**Form Data Structure:**
```typescript
{
  name: string,
  email: string,
  phone: string,
  company: string,
  contact_person: string,
  address: string,
  city: string,
  state: string,
  zip_code: string,
  client_type: string,  // Default: "individual"
  status: string,       // Default: "active"
  notes: string
}
```

**Data Transformations:**
- None (all submitted as strings)

**Validation:**
- `name` is required
- All other fields optional

### Staff Form Fields

**File:** `/web/components/staff-form.tsx`

**Form Data Structure:**
```typescript
{
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  role: string,
  department: string,  // Default: "kitchen"
  status: string,      // Default: "active"
  hire_date: string,
  hourly_rate: string | number,
  certification_level: string,  // Default: "intermediate"
  notes: string
}
```

**Data Transformations:**
- `hourly_rate`: Parsed to float before submission (nullable)

**Validation:**
- `first_name`, `last_name`, and `role` are required
- All other fields optional

### Menu Item Form Fields

**File:** `/web/components/menu-item-form.tsx`

**Form Data Structure:**
```typescript
{
  name: string,
  category: string,  // Default: "appetizer"
  description: string,
  dietary_info: string,
  prep_time_minutes: string | number,
  cost_per_serving: string | number,
  price_per_serving: string | number,
  minimum_order_quantity: string | number,  // Default: "1"
  is_available: boolean  // Default: true
}
```

**Data Transformations:**
- `prep_time_minutes`: Parsed to integer (nullable)
- `cost_per_serving`: Parsed to float (nullable)
- `price_per_serving`: Parsed to float (nullable)
- `minimum_order_quantity`: Parsed to integer (default 1)

**Validation:**
- `name` and `category` are required
- All other fields optional

---

## Schema Mismatches Identified

During the development process, six critical schema mismatches were identified and resolved through migrations 004-006. This section documents each mismatch, its impact, and the resolution applied.

### Table 3: Schema Mismatch Summary

| # | Table | Issue | Impact | Resolution | Migration |
|---|-------|-------|--------|------------|-----------|
| 1 | events | Missing web ERP fields | Form submission failed | Added 10 new columns | 004 |
| 2 | events | Field name mismatch (guest_count) | Display showed 0 | Fixed data mapping | Code fix |
| 3 | events | Field name mismatch (budget) | Display showed $0 | Fixed data mapping | Code fix |
| 4 | menu_items | Missing category column | Form submission failed | Added category column | 005 |
| 5 | menu_items | Field name mismatch (min_order_quantity vs minimum_order_quantity) | Form submission failed | Renamed to minimum_order_quantity | Code fix |
| 6 | menu_items | Field name mismatch (prep_time vs prep_time_minutes) | Form submission failed | Renamed to prep_time_minutes | 005 |
| 7 | menu_items | NOT NULL constraint on station | Form submission failed | Made station nullable | 006 |

### Mismatch #1: Events Table Missing Web ERP Fields

**Severity:** Critical  
**Status:** ✅ Resolved

**Problem:**
The original `events` table (migration 001) was designed for KDS operations with minimal fields. The web ERP event form attempted to submit 10 fields that did not exist in the database schema.

**Original Schema Fields:**
- `name`, `client`, `guest_count`, `venue`, `start_time`

**Form Attempted to Submit:**
- `event_name`, `event_date`, `event_time`, `venue_name`, `venue_address`, `guest_count`, `event_type`, `status`, `budget`, `notes`

**Impact:**
- Event creation failed with database error
- Web ERP event management completely non-functional

**Resolution:**
Migration 004 added all missing columns to the `events` table. Original columns were made nullable to maintain backward compatibility with KDS operations.

### Mismatch #2 & #3: Events Display Field Mapping

**Severity:** High  
**Status:** ✅ Resolved

**Problem:**
The events list page was reading data using incorrect field names, causing guest count and budget to display as 0 even when data existed in the database.

**Code Issue:**
```typescript
// ❌ INCORRECT - Looking for wrong field names
guest_count: event.total_guests || 0,  // Should be event.guest_count
budget: event.total_guests * 50        // Should be event.budget
```

**Impact:**
- Event list showed "0 guests" for all events
- Budget displayed as calculated value instead of actual budget

**Resolution:**
Fixed data mapping in `/web/app/events/page.tsx` to use correct field names from database.

### Mismatch #4-6: Menu Items Table Schema Issues

**Severity:** Critical  
**Status:** ✅ Resolved

**Problem:**
The original `menu_items` table (migration 001) contained only 4 columns for KDS operations. The web ERP menu form required 9 additional fields for comprehensive menu management.

**Original Schema:**
- `id`, `course_id`, `name`, `station`

**Form Required:**
- `name`, `category`, `description`, `dietary_info`, `prep_time_minutes`, `cost_per_serving`, `price_per_serving`, `minimum_order_quantity`, `is_available`

**Specific Issues:**

1. **Missing category column**: Form field `category` had no corresponding database column
2. **Field name mismatch**: Form used `prep_time_minutes` but migration initially created `prep_time`
3. **Field name mismatch**: Form used `minimum_order_quantity` but code initially used `min_order_quantity`

**Impact:**
- Menu item creation completely non-functional
- Error: "Could not find the 'category' column"
- Error: "Could not find the 'min_order_quantity' column"
- Error: "Could not find the 'prep_time_minutes' column"

**Resolution:**
- Migration 005 added all missing columns with correct names
- Form code updated to use `minimum_order_quantity` consistently

### Mismatch #7: Menu Items Station NOT NULL Constraint

**Severity:** Critical  
**Status:** ✅ Resolved

**Problem:**
The `station` column in `menu_items` table had a NOT NULL constraint from the original KDS schema. However, web ERP menu items are general menu offerings not yet assigned to specific kitchen stations.

**Original Constraint:**
```sql
station TEXT NOT NULL
```

**Impact:**
- Menu item creation failed with error: "null value in column 'station' violates not-null constraint"
- Web ERP could not create menu items

**Resolution:**
Migration 006 made the `station` column nullable:
```sql
ALTER TABLE menu_items ALTER COLUMN station DROP NOT NULL;
```

**Rationale:**
- KDS operations require station assignment when orders are fired
- Web ERP menu management operates at a higher level (menu planning, pricing)
- Station assignment happens later in the workflow when menu items are added to event courses

---

## Current Schema Status

### Table 4: Schema Health by Table

| Table | Form Exists | Schema Complete | Field Mapping Correct | Issues Remaining |
|-------|-------------|-----------------|----------------------|------------------|
| events | ✅ Yes | ✅ Yes | ✅ Yes | None |
| menu_items | ✅ Yes | ✅ Yes | ✅ Yes | None |
| clients | ✅ Yes | ✅ Yes | ✅ Yes | None |
| staff | ✅ Yes | ✅ Yes | ✅ Yes | None |
| courses | ❌ No | ✅ Yes | N/A | No web form yet |
| table_groups | ❌ No | ✅ Yes | N/A | No web form yet |
| fired_courses | ❌ No | ✅ Yes | N/A | KDS only |
| order_items | ❌ No | ✅ Yes | N/A | KDS only |
| ingredients | ❌ No | ✅ Yes | N/A | No web form yet |
| stock_levels | ❌ No | ✅ Yes | N/A | No web form yet |
| recipe_ingredients | ❌ No | ✅ Yes | N/A | No web form yet |
| inventory_transactions | ❌ No | ✅ Yes | N/A | System-generated |
| low_stock_alerts | ❌ No | ✅ Yes | N/A | System-generated |
| client_events | ❌ No | ✅ Yes | N/A | System-generated |
| staff_assignments | ❌ No | ✅ Yes | N/A | No web form yet |

### Critical Findings

**✅ All Critical Issues Resolved**

All four web ERP forms (Events, Clients, Staff, Menu Items) are now fully functional with correct schema mappings. CRUD operations (Create, Read, Update, Delete) have been tested and verified for each form.

**Schema Completeness:**
- Events table: 100% complete for web ERP needs
- Menu Items table: 100% complete for web ERP needs
- Clients table: 100% complete (no changes needed)
- Staff table: 100% complete (no changes needed)

**Data Integrity:**
- All foreign key relationships properly defined
- Indexes created for performance optimization
- Row Level Security (RLS) enabled on all tables
- Triggers in place for `updated_at` timestamps

---

## Recommendations

### Minor Issues & Opportunities

While all critical mismatches have been resolved, two minor recommendations emerged from the audit:

#### Recommendation 1: Standardize Field Naming Across Legacy Columns

**Issue:**
The `events` table contains both old KDS fields (`name`, `client`, `venue`) and new web ERP fields (`event_name`, `client_id`, `venue_name`). This dual schema creates confusion and potential for errors.

**Current State:**
- Old: `name` (TEXT) vs New: `event_name` (TEXT)
- Old: `client` (TEXT) vs New: `client_id` (UUID FK)
- Old: `venue` (TEXT) vs New: `venue_name` + `venue_address`
- Old: `start_time` (TIMESTAMPTZ) vs New: `event_date` + `event_time`

**Recommendation:**
- Deprecate old columns in favor of new structured fields
- Update KDS mobile app to use new field names
- Create migration to drop old columns after transition period

**Priority:** Low (functional but not optimal)

#### Recommendation 2: Add Web Forms for Inventory Management

**Issue:**
The inventory management tables (`ingredients`, `stock_levels`, `recipe_ingredients`) have no corresponding web forms, limiting the usability of the inventory tracking system.

**Missing Functionality:**
- No way to add new ingredients via web UI
- No way to adjust stock levels manually
- No way to define recipes (ingredient quantities per menu item)

**Recommendation:**
- Create ingredient management form
- Create stock adjustment form
- Create recipe builder form
- Link recipe builder to menu item form

**Priority:** Medium (feature gap, not a bug)

---

## Appendix A: Migration History

### Table 5: Complete Migration Timeline

| Migration | Date Applied | Purpose | Tables Affected | Status |
|-----------|--------------|---------|-----------------|--------|
| 001_kds_schema.sql | Initial | Create KDS tables | events, courses, menu_items, table_groups, fired_courses, order_items | ✅ Applied |
| 002_inventory_schema.sql | Initial | Create inventory system | ingredients, stock_levels, recipe_ingredients, inventory_transactions, low_stock_alerts | ✅ Applied |
| 003_clients_staff_schema.sql | Initial | Create CRM and staff tables | clients, client_events, staff, staff_assignments | ✅ Applied |
| 004_update_events_schema.sql | Jan 9, 2026 | Add web ERP event fields | events | ✅ Applied |
| 005_update_menu_items_schema.sql | Jan 9, 2026 | Add web ERP menu fields | menu_items | ✅ Applied |
| 006_make_station_nullable.sql | Jan 9, 2026 | Remove station constraint | menu_items | ✅ Applied |

---

## Appendix B: Field Naming Conventions Observed

Based on the audit, the following naming patterns were observed in the current schema:

### Database Column Naming

**Consistent Patterns:**
- Primary keys: `id` (UUID)
- Foreign keys: `{table_name}_id` (e.g., `client_id`, `event_id`)
- Timestamps: `created_at`, `updated_at`, `{action}_at` (e.g., `fired_at`, `served_at`)
- Boolean flags: `is_{property}` (e.g., `is_available`)
- Counts: `total_{noun}` or `{noun}_count` (e.g., `total_events`, `guest_count`)
- Rates/Amounts: `{property}_per_{unit}` (e.g., `cost_per_serving`, `cost_per_unit`)

**Inconsistent Patterns:**
- Time durations: `prep_time_minutes` (explicit unit) vs `hours_worked` (implied unit)
- Name fields: `name` vs `event_name` vs `first_name`/`last_name`
- Location fields: `venue` vs `venue_name`/`venue_address` vs `address`/`city`/`state`

### Form Field Naming

**Observations:**
- Web forms use `snake_case` matching database columns (✅ Good)
- No camelCase in form data objects (✅ Good)
- Field names match database columns exactly after fixes (✅ Good)

---

## Appendix C: Data Type Reference

### Table 6: Common Data Types Used

| Data Type | Usage | Examples |
|-----------|-------|----------|
| UUID | Primary keys, foreign keys | `id`, `client_id`, `event_id` |
| TEXT | Long strings, unlimited length | `name`, `description`, `notes`, `address` |
| VARCHAR(n) | Short strings, limited length | `email` (255), `phone` (50), `role` (100) |
| INTEGER | Whole numbers | `guest_count`, `total_events`, `prep_time_minutes` |
| DECIMAL(p,s) | Monetary values, ratings | `budget` (10,2), `hourly_rate` (10,2) |
| BOOLEAN | True/false flags | `is_available`, `acknowledged` |
| DATE | Date only | `hire_date`, `event_date` |
| TIME | Time only | `event_time` |
| TIMESTAMPTZ | Date + time with timezone | `created_at`, `updated_at`, `start_time` |
| TEXT[] | Array of strings | `specialties`, `modifications`, `table_numbers` |
| JSONB | Structured JSON data | `availability` (staff schedules) |

---

## Conclusion

This comprehensive audit has documented the complete database schema, inventoried all web ERP forms, and identified all schema mismatches between forms and database tables. All critical issues have been resolved through migrations 004-006 and code fixes.

**Audit Outcomes:**

✅ **15 tables** fully documented with column definitions, data types, and constraints  
✅ **4 web forms** inventoried with exact field names and data transformations  
✅ **7 schema mismatches** identified and resolved  
✅ **0 critical issues** remaining  
✅ **2 minor recommendations** for future improvement

The database schema is now in a healthy state with all web ERP CRUD operations functioning correctly. The documentation produced by this audit will serve as the foundation for Phase 2 (TypeScript type generation and schema validation) and Phase 3 (Drizzle ORM migration and automation tooling).

**Next Steps:**

1. Review this audit report with the development team
2. Prioritize recommendations (inventory forms, legacy field deprecation)
3. Proceed to Task 2: Unified Schema Documentation
4. Begin Phase 2 implementation after Phase 1 completion

---

**Document Control:**

- **Version:** 1.0
- **Status:** Final
- **Distribution:** Development Team, Product Management
- **Next Review:** End of Sprint
- **Related Documents:** 
  - `phase1_migration_optimization_plan.md`
  - `database_schema.md` (to be created in Task 2)
  - `naming_conventions.md` (to be created in Task 3)
