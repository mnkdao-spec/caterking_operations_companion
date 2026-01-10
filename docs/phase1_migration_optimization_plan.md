# Phase 1: Database Migration Optimization - Immediate Actions

**Timeline**: Next Sprint (1-2 weeks)  
**Priority**: High  
**Owner**: Development Team  
**Status**: Planning

---

## Overview

Phase 1 focuses on establishing foundational documentation and standardization to prevent future schema mismatches. This phase requires no code changes but creates the infrastructure for future improvements.

---

## Objectives

1. Document all existing database schema inconsistencies
2. Create comprehensive schema documentation for KDS and web ERP
3. Establish and enforce field naming conventions
4. Build a data dictionary mapping business concepts to technical implementation

---

## Detailed Tasks

### Task 1: Schema Audit & Mismatch Documentation

**Duration**: 2 days  
**Assignee**: Backend Developer + Frontend Developer (pair work)

**Steps:**

1. **Inventory All Database Tables**
   - List all tables in Supabase database
   - Document current column names, types, and constraints
   - Note which tables are used by KDS vs web ERP vs both

2. **Inventory All Forms**
   - Web ERP forms: Events, Clients, Staff, Menu Items
   - Mobile KDS forms: (if any)
   - List all form field names and expected data types

3. **Identify Mismatches**
   - Compare form field names to database column names
   - Document discrepancies (e.g., `min_order_quantity` vs `minimum_order_quantity`)
   - Note missing columns that forms expect
   - Identify constraint conflicts (NOT NULL, UNIQUE, etc.)

4. **Create Mismatch Report**
   - Table: `events`
     - ✓ Fixed: `event_name`, `event_date`, `event_time` added
     - ✓ Fixed: `guest_count` mapping corrected
     - ✓ Fixed: `budget` field added
   - Table: `menu_items`
     - ✓ Fixed: `minimum_order_quantity` vs `min_order_quantity`
     - ✓ Fixed: `prep_time_minutes` vs `prep_time`
     - ✓ Fixed: `station` made nullable
     - Remaining: Document any other fields
   - Table: `clients`
     - Status: Audit needed
   - Table: `staff`
     - Status: Audit needed

**Deliverable**: `docs/schema_audit_report.md`

---

### Task 2: Unified Schema Documentation

**Duration**: 3 days  
**Assignee**: Backend Developer

**Steps:**

1. **Create Master Schema Document**
   - Document structure: One section per table
   - For each table include:
     - Purpose and business context
     - Used by: KDS / Web ERP / Both
     - Column definitions with descriptions
     - Relationships to other tables
     - Indexes and constraints
     - Sample data

2. **Document Each Table**

   **Example Structure:**
   ```markdown
   ## Table: events
   
   **Purpose**: Store catering event information for both KDS operations and web ERP management
   
   **Used By**: KDS (read), Web ERP (full CRUD)
   
   ### Columns
   
   | Column | Type | Nullable | Default | Description | Used By |
   |--------|------|----------|---------|-------------|---------|
   | id | UUID | No | uuid_generate_v4() | Primary key | Both |
   | event_name | TEXT | No | - | Display name of the event | Web ERP |
   | event_date | DATE | No | - | Date of the event | Web ERP |
   | event_time | TIME | No | - | Start time of the event | Web ERP |
   | guest_count | INTEGER | No | - | Number of expected guests | Both |
   | venue_name | TEXT | Yes | - | Venue name | Web ERP |
   | venue_address | TEXT | Yes | - | Full venue address | Web ERP |
   | event_type | TEXT | Yes | - | Type: wedding, corporate, private | Web ERP |
   | status | TEXT | Yes | 'Lead' | Lead, Confirmed, Completed, Cancelled | Web ERP |
   | budget | DECIMAL(10,2) | Yes | - | Total event budget | Web ERP |
   | notes | TEXT | Yes | - | Internal notes | Web ERP |
   | client_id | UUID | Yes | - | FK to clients table | Web ERP |
   | created_at | TIMESTAMP | No | NOW() | Record creation time | Both |
   | updated_at | TIMESTAMP | No | NOW() | Last update time | Both |
   
   ### Relationships
   - `client_id` → `clients.id` (many-to-one)
   - `events.id` ← `courses.event_id` (one-to-many)
   
   ### Indexes
   - PRIMARY KEY on `id`
   - INDEX on `event_date` for date range queries
   - INDEX on `status` for filtering
   - INDEX on `client_id` for joins
   
   ### Business Rules
   - Event date cannot be in the past (application-level validation)
   - Guest count must be > 0
   - Budget must be >= 0 if provided
   ```

3. **Document All Tables**
   - events ✓ (example above)
   - menu_items
   - clients
   - staff
   - courses
   - table_groups
   - fired_courses
   - order_items

**Deliverable**: `docs/database_schema.md`

---

### Task 3: Field Naming Convention Standards

**Duration**: 1 day  
**Assignee**: Tech Lead

**Steps:**

1. **Define Naming Rules**
   
   **Database Columns:**
   - Use `snake_case` for all column names
   - Use full words, avoid abbreviations (e.g., `description` not `desc`)
   - Boolean columns: prefix with `is_` or `has_` (e.g., `is_available`)
   - Foreign keys: suffix with `_id` (e.g., `client_id`)
   - Timestamps: use `created_at`, `updated_at`, `deleted_at`
   - Avoid reserved SQL keywords
   
   **Form Fields (TypeScript/JavaScript):**
   - Use `snake_case` to match database columns exactly
   - No camelCase in form data objects that map directly to database
   - Use TypeScript interfaces that mirror database schema
   
   **API Endpoints:**
   - Use kebab-case in URLs: `/api/menu-items`
   - Use snake_case in JSON payloads to match database
   
   **Examples:**
   ```typescript
   // ✓ CORRECT - Form field matches database column
   const formData = {
     event_name: "Wedding Reception",
     guest_count: 150,
     is_available: true
   };
   
   // ✗ INCORRECT - Mismatch causes bugs
   const formData = {
     eventName: "Wedding Reception",  // camelCase doesn't match DB
     guestCount: 150,
     available: true  // missing is_ prefix
   };
   ```

2. **Document Exceptions**
   - List any legacy fields that don't follow conventions
   - Create migration plan to rename them
   - Document why exceptions exist

3. **Create Quick Reference Guide**
   - One-page cheat sheet for developers
   - Common patterns and examples
   - Checklist for adding new fields

**Deliverable**: `docs/naming_conventions.md`

---

### Task 4: Data Dictionary

**Duration**: 2 days  
**Assignee**: Product Manager + Backend Developer

**Steps:**

1. **Map Business Concepts to Technical Implementation**

   **Example Structure:**
   ```markdown
   ## Data Dictionary
   
   ### Event Management
   
   | Business Term | Database Table | Column(s) | Notes |
   |---------------|----------------|-----------|-------|
   | Event Name | events | event_name | Display name shown to users |
   | Guest Count | events | guest_count | Total expected attendees |
   | Event Budget | events | budget | Total budget in USD |
   | Event Status | events | status | Lead/Confirmed/Completed/Cancelled |
   | Venue | events | venue_name, venue_address | Separate fields for name and address |
   
   ### Menu Management
   
   | Business Term | Database Table | Column(s) | Notes |
   |---------------|----------------|-----------|-------|
   | Dish Name | menu_items | name | Official menu item name |
   | Prep Time | menu_items | prep_time_minutes | Time in minutes |
   | Food Cost | menu_items | cost_per_serving | Cost to prepare one serving |
   | Menu Price | menu_items | price_per_serving | Price charged to customer |
   | Profit Margin | - | calculated | (price - cost) / price * 100 |
   | Kitchen Station | menu_items | station | grill/saute/garde_manger/dessert |
   | Dietary Info | menu_items | dietary_info | Comma-separated tags |
   ```

2. **Document Calculated Fields**
   - Fields that don't exist in database but are computed
   - Formula and logic for each calculation
   - Where the calculation happens (frontend/backend)

3. **Document Enums and Constants**
   ```markdown
   ### Event Status Values
   - `Lead` - Initial inquiry, not confirmed
   - `Confirmed` - Contract signed, deposit received
   - `Completed` - Event has occurred
   - `Cancelled` - Event was cancelled
   
   ### Event Types
   - `wedding` - Wedding reception
   - `corporate` - Corporate event
   - `private` - Private party
   
   ### Kitchen Stations
   - `grill` - Grill station
   - `saute` - Sauté station
   - `garde_manger` - Cold prep station
   - `dessert` - Dessert station
   ```

**Deliverable**: `docs/data_dictionary.md`

---

### Task 5: Migration Checklist Template

**Duration**: 1 day  
**Assignee**: Backend Developer

**Steps:**

1. **Create Pre-Migration Checklist**
   ```markdown
   ## Database Migration Checklist
   
   ### Before Writing Migration
   - [ ] Reviewed schema documentation
   - [ ] Checked naming conventions compliance
   - [ ] Verified field names match form fields exactly
   - [ ] Confirmed data types are appropriate
   - [ ] Considered nullable vs NOT NULL constraints
   - [ ] Planned default values for existing rows
   - [ ] Documented business reason for change
   
   ### Migration File
   - [ ] Descriptive filename with sequence number
   - [ ] Comments explaining purpose
   - [ ] Rollback instructions included
   - [ ] Tested on local database copy
   - [ ] Verified no breaking changes to existing queries
   
   ### After Migration
   - [ ] Updated schema documentation
   - [ ] Updated data dictionary if needed
   - [ ] Tested all affected forms
   - [ ] Verified CRUD operations work
   - [ ] Checked for console errors
   - [ ] Updated TypeScript interfaces (if applicable)
   ```

2. **Create Migration Template**
   ```sql
   -- Migration: [Brief description]
   -- Date: YYYY-MM-DD
   -- Author: [Name]
   -- Ticket: [Issue/Story ID]
   --
   -- Purpose:
   -- [Detailed explanation of why this migration is needed]
   --
   -- Affected Systems:
   -- [ ] KDS Mobile App
   -- [ ] Web ERP
   -- [ ] Reports
   --
   -- Breaking Changes:
   -- [ ] Yes - [Describe impact]
   -- [ ] No
   --
   -- Rollback Plan:
   -- [SQL commands to reverse this migration]
   
   -- Migration SQL
   BEGIN;
   
   -- Your changes here
   
   COMMIT;
   ```

**Deliverable**: `docs/migration_checklist.md` and `supabase/migrations/TEMPLATE.sql`

---

### Task 6: Team Training & Documentation Review

**Duration**: 1 day  
**Assignee**: Tech Lead

**Steps:**

1. **Conduct Team Workshop**
   - Present schema audit findings
   - Walk through new documentation
   - Explain naming conventions
   - Demonstrate migration checklist usage
   - Q&A session

2. **Create Developer Onboarding Guide**
   - Quick start: "Adding a new database field"
   - Common pitfalls and how to avoid them
   - Where to find documentation
   - Who to ask for help

3. **Set Up Documentation Review Process**
   - Documentation must be updated with every schema change
   - Pull request template includes documentation checklist
   - Assign documentation maintainer role

**Deliverable**: `docs/developer_onboarding.md` and team training session

---

## Success Criteria

✅ **Documentation Complete**
- All tables documented with column definitions
- Data dictionary covers all business concepts
- Naming conventions documented and approved

✅ **Team Alignment**
- All developers trained on new standards
- Migration checklist integrated into workflow
- Documentation review process established

✅ **Audit Complete**
- All schema mismatches identified and documented
- Remaining issues prioritized for Phase 2
- No unknown discrepancies between forms and database

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Documentation becomes outdated | High | Integrate into PR process, assign maintainer |
| Team doesn't follow new standards | Medium | Include in code review checklist, automate validation |
| Audit reveals more issues than expected | Medium | Prioritize critical issues, defer non-breaking changes |
| Time estimates too optimistic | Low | Break tasks into smaller chunks, adjust as needed |

---

## Dependencies

- Access to Supabase database
- Collaboration from frontend and backend teams
- Product manager input for business terminology

---

## Next Steps After Phase 1

Once Phase 1 is complete, proceed to:
- **Phase 2**: Implement TypeScript type generation and schema validation tests
- **Phase 3**: Migrate to Drizzle ORM and build automation tooling

---

## Appendix: File Structure

```
caterking_operations_companion/
├── docs/
│   ├── schema_audit_report.md          [Task 1]
│   ├── database_schema.md              [Task 2]
│   ├── naming_conventions.md           [Task 3]
│   ├── data_dictionary.md              [Task 4]
│   ├── migration_checklist.md          [Task 5]
│   └── developer_onboarding.md         [Task 6]
├── supabase/
│   └── migrations/
│       └── TEMPLATE.sql                [Task 5]
```

---

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Review Date**: End of Sprint
