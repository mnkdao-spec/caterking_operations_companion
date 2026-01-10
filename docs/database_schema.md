# CaterKing Database Schema Documentation
## Unified Reference for All Tables, Relationships, and Business Logic

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Maintained By:** Development Team  
**Project:** CaterKing Operations Companion

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Architecture](#schema-architecture)
3. [Core KDS Tables](#core-kds-tables)
4. [Inventory Management Tables](#inventory-management-tables)
5. [CRM & Staff Management Tables](#crm--staff-management-tables)
6. [Table Relationships](#table-relationships)
7. [Indexes & Performance](#indexes--performance)
8. [Security & RLS Policies](#security--rls-policies)
9. [Triggers & Functions](#triggers--functions)
10. [Migration History](#migration-history)

---

## Overview

The CaterKing database supports a comprehensive catering business management platform with three primary subsystems:

1. **Kitchen Display System (KDS)** - Real-time order tracking and kitchen operations
2. **Inventory Management** - Ingredient tracking, recipes, and stock levels
3. **Enterprise Resource Planning (ERP)** - Client CRM, staff management, and event planning

**Database Technology:** PostgreSQL 15+ with PostgREST API  
**Total Tables:** 15  
**Total Migrations:** 7  
**Security:** Row Level Security (RLS) enabled on all tables

---

## Schema Architecture

### System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    CaterKing Database                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │   KDS System     │  │   Inventory      │  │  ERP/CRM   ││
│  │                  │  │   Management     │  │  System    ││
│  │ • events         │  │ • ingredients    │  │ • clients  ││
│  │ • courses        │  │ • stock_levels   │  │ • staff    ││
│  │ • menu_items     │  │ • recipes        │  │ • events   ││
│  │ • table_groups   │  │ • transactions   │  │            ││
│  │ • fired_courses  │  │ • alerts         │  │            ││
│  │ • order_items    │  │                  │  │            ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Event Planning (ERP) → Service Execution (KDS) → Inventory Depletion**

1. Event created in web ERP with client, venue, budget
2. Menu items assigned to event courses
3. Recipes linked to menu items define ingredient requirements
4. During service, courses are "fired" creating order items
5. Order items are tracked by kitchen station (grill, saute, etc.)
6. When orders complete, inventory is automatically decremented
7. Low stock alerts trigger when ingredients fall below reorder levels

---

## Core KDS Tables

The Kitchen Display System tables support real-time order tracking during live catering events.

### events

Central table storing event information for both KDS operations and ERP management.

**Purpose:** Store all event details including client information, venue, timing, and budget.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique event identifier |
| `name` | TEXT | nullable | Legacy KDS event name |
| `client` | TEXT | nullable | Legacy KDS client name (text) |
| `guest_count` | INTEGER | nullable | Legacy KDS guest count |
| `venue` | TEXT | nullable | Legacy KDS venue name |
| `start_time` | TIMESTAMPTZ | nullable | Legacy KDS event start time |
| `event_name` | TEXT | nullable | Web ERP event display name |
| `event_date` | DATE | nullable | Web ERP event date (separate from time) |
| `event_time` | TIME | nullable | Web ERP event time (separate from date) |
| `venue_name` | TEXT | nullable | Web ERP structured venue name |
| `venue_address` | TEXT | nullable | Web ERP full venue address |
| `event_type` | TEXT | DEFAULT 'wedding' | Event category: wedding, corporate, private |
| `status` | TEXT | DEFAULT 'lead' | Event status: lead, confirmed, completed, cancelled |
| `budget` | DECIMAL(10,2) | nullable | Event budget in dollars |
| `notes` | TEXT | nullable | Internal notes and special instructions |
| `client_id` | UUID | FK → clients(id) ON DELETE SET NULL | Reference to clients table |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_events_start_time` - Query events by start time
- `idx_events_event_date` - Query events by date (web ERP)
- `idx_events_client_id` - Join with clients table
- `idx_events_status` - Filter by event status

**Business Rules:**
- Events can exist without a linked client (client_id nullable)
- Legacy fields (name, client, venue, start_time) maintained for KDS backward compatibility
- Web ERP uses new structured fields (event_name, event_date, event_time, venue_name, venue_address)
- Status progression: lead → confirmed → completed (or cancelled)

**Used By:** KDS mobile app, Web ERP

---

### courses

Defines the meal courses for an event (e.g., Appetizers, Main Course, Dessert).

**Purpose:** Organize menu items into sequential courses for service timing.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique course identifier |
| `event_id` | UUID | NOT NULL, FK → events(id) ON DELETE CASCADE | Parent event |
| `course_number` | INTEGER | NOT NULL | Sequential course order (1, 2, 3...) |
| `name` | TEXT | NOT NULL | Course name (e.g., "Appetizers", "Main Course") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| UNIQUE(`event_id`, `course_number`) | | | Prevent duplicate course numbers per event |

**Indexes:**
- `idx_courses_event_id` - Query courses by event

**Business Rules:**
- Each event can have multiple courses
- Course numbers must be unique within an event
- Deleting an event cascades to delete all its courses
- Typical course sequence: 1=Appetizers, 2=Salad, 3=Main, 4=Dessert

**Used By:** KDS mobile app

---

### menu_items

Master list of dishes and recipes available for catering events.

**Purpose:** Store all menu items with pricing, preparation details, and dietary information.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique menu item identifier |
| `course_id` | UUID | nullable, FK → courses(id) ON DELETE CASCADE | Link to specific event course (KDS) |
| `name` | TEXT | NOT NULL | Menu item name |
| `station` | TEXT | nullable | Kitchen station: grill, saute, garde_manger, dessert |
| `category` | TEXT | nullable | Menu category: appetizer, entrée, side dish, dessert, beverage |
| `prep_time_minutes` | INTEGER | nullable | Preparation time in minutes |
| `description` | TEXT | nullable | Dish description for clients |
| `dietary_info` | TEXT | nullable | Dietary restrictions/allergens |
| `cost_per_serving` | DECIMAL(10,2) | nullable | Cost to prepare one serving |
| `price_per_serving` | DECIMAL(10,2) | nullable | Price charged to customer |
| `minimum_order_quantity` | INTEGER | DEFAULT 1 | Minimum order quantity |
| `is_available` | BOOLEAN | DEFAULT true | Whether item is currently available |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_menu_items_course_id` - Query items by course (KDS)
- `idx_menu_items_category` - Filter by category (web ERP)
- `idx_menu_items_is_available` - Filter available items

**Business Rules:**
- Menu items can exist independently (course_id nullable) for web ERP menu library
- When linked to a course, item becomes part of that event's menu
- Station assignment optional for general menu items, required when added to KDS
- Profit margin = (price_per_serving - cost_per_serving) / price_per_serving

**Used By:** KDS mobile app, Web ERP

---

### table_groups

Groups of tables for coordinated service timing.

**Purpose:** Manage table groupings to fire courses together for synchronized service.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique table group identifier |
| `event_id` | UUID | NOT NULL, FK → events(id) ON DELETE CASCADE | Parent event |
| `name` | TEXT | NOT NULL | Group name (e.g., "Tables 1-4", "VIP Section") |
| `guest_count` | INTEGER | NOT NULL | Number of guests in this group |
| `table_numbers` | TEXT[] | NOT NULL | Array of table numbers (e.g., ['1', '2', '3', '4']) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_table_groups_event_id` - Query table groups by event

**Business Rules:**
- Each event can have multiple table groups
- Table numbers stored as array for flexibility
- Guest count per group used for portion planning
- Deleting an event cascades to delete all table groups

**Used By:** KDS mobile app

---

### fired_courses

Tracks when courses are "fired" (sent to kitchen) for table groups.

**Purpose:** Record course firing events and track service status through completion.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique fired course identifier |
| `event_id` | UUID | NOT NULL, FK → events(id) ON DELETE CASCADE | Parent event |
| `course_id` | UUID | NOT NULL, FK → courses(id) ON DELETE CASCADE | Course being fired |
| `table_group_id` | UUID | NOT NULL, FK → table_groups(id) ON DELETE CASCADE | Target table group |
| `status` | TEXT | NOT NULL, DEFAULT 'fired' | Status: fired, in_progress, ready, served |
| `fired_at` | TIMESTAMPTZ | DEFAULT NOW() | When course was fired to kitchen |
| `served_at` | TIMESTAMPTZ | nullable | When course was served to guests |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_fired_courses_event_id` - Query by event
- `idx_fired_courses_status` - Filter by status

**Business Rules:**
- Status progression: fired → in_progress → ready → served
- Multiple table groups can fire the same course at different times
- Service time = served_at - fired_at
- Deleting event/course/table_group cascades to delete fired courses

**Used By:** KDS mobile app

---

### order_items

Individual dishes that need to be prepared for fired courses.

**Purpose:** Break down fired courses into individual dishes tracked by kitchen station.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique order item identifier |
| `fired_course_id` | UUID | NOT NULL, FK → fired_courses(id) ON DELETE CASCADE | Parent fired course |
| `menu_item_id` | UUID | NOT NULL, FK → menu_items(id) ON DELETE CASCADE | Dish to prepare |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | Number of portions |
| `station` | TEXT | NOT NULL | Kitchen station (denormalized from menu_items) |
| `modifications` | TEXT[] | DEFAULT '{}' | Special requests (e.g., ['no onions', 'extra sauce']) |
| `status` | TEXT | NOT NULL, DEFAULT 'queued' | Status: queued, cooking, done |
| `fired_at` | TIMESTAMPTZ | DEFAULT NOW() | When order was sent to station |
| `bumped_at` | TIMESTAMPTZ | nullable | When chef marked order complete |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_order_items_fired_course_id` - Query by fired course
- `idx_order_items_station` - Filter by kitchen station
- `idx_order_items_status` - Filter by status

**Business Rules:**
- Status progression: queued → cooking → done
- Station denormalized for quick filtering by kitchen display
- Modifications array allows flexible special requests
- Cook time = bumped_at - fired_at
- When order item marked done, inventory automatically decremented

**Used By:** KDS mobile app

---

## Inventory Management Tables

The inventory system tracks ingredients, recipes, stock levels, and automatically decrements inventory as orders are completed.

### ingredients

Master list of all ingredients used in recipes.

**Purpose:** Define ingredients with cost, unit of measure, and reorder levels.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique ingredient identifier |
| `name` | TEXT | NOT NULL | Ingredient name |
| `unit` | TEXT | NOT NULL | Unit of measure: oz, lb, ml, l, count, bunch, etc. |
| `category` | TEXT | NOT NULL | Category: protein, vegetable, grain, dairy, spice, etc. |
| `cost_per_unit` | DECIMAL(10,2) | NOT NULL | Cost per unit in dollars |
| `reorder_level` | DECIMAL(12,2) | NOT NULL | Alert when stock falls below this level |
| `supplier` | TEXT | nullable | Supplier name or contact |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:** None (small table, full scans acceptable)

**Business Rules:**
- Units must be consistent across all uses of an ingredient
- Reorder level triggers low stock alerts
- Cost per unit used to calculate recipe costs
- Category used for organizing inventory reports

**Used By:** Web ERP

---

### stock_levels

Current inventory levels for ingredients.

**Purpose:** Track current quantity of each ingredient, optionally per event.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique stock level record identifier |
| `ingredient_id` | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient being tracked |
| `event_id` | UUID | nullable, FK → events(id) ON DELETE CASCADE | Event-specific inventory (null = permanent) |
| `quantity` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Current quantity in stock |
| `last_updated` | TIMESTAMPTZ | DEFAULT NOW() | Last inventory update |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update timestamp |
| UNIQUE(`ingredient_id`, `event_id`) | | | One stock level per ingredient per event |

**Indexes:**
- `idx_stock_levels_ingredient_id` - Query by ingredient
- `idx_stock_levels_event_id` - Query by event

**Business Rules:**
- event_id NULL represents permanent/general inventory
- event_id set represents event-specific inventory (pre-positioned for large events)
- Quantity automatically decremented when order items complete
- Negative quantities indicate over-consumption (alert condition)

**Used By:** Web ERP, KDS (via automatic decrement function)

---

### recipe_ingredients

Defines ingredient quantities required for each menu item.

**Purpose:** Link menu items to ingredients with quantities for cost calculation and inventory depletion.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique recipe ingredient identifier |
| `menu_item_id` | UUID | NOT NULL, FK → menu_items(id) ON DELETE CASCADE | Menu item (dish) |
| `ingredient_id` | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Required ingredient |
| `quantity` | DECIMAL(12,2) | NOT NULL | Amount used per serving |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| UNIQUE(`menu_item_id`, `ingredient_id`) | | | One entry per ingredient per menu item |

**Indexes:**
- `idx_recipe_ingredients_menu_item_id` - Query ingredients for a menu item
- `idx_recipe_ingredients_ingredient_id` - Query menu items using an ingredient

**Business Rules:**
- Quantity units must match ingredient unit definition
- Recipe cost = SUM(ingredient.cost_per_unit * recipe_ingredient.quantity)
- When order item completes, all recipe ingredients decremented by quantity * order_item.quantity
- Deleting menu item cascades to delete recipe ingredients

**Used By:** Web ERP, KDS (via decrement_stock function)

---

### inventory_transactions

Audit trail of all inventory changes.

**Purpose:** Maintain complete history of inventory movements for accountability and analysis.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique transaction identifier |
| `event_id` | UUID | nullable, FK → events(id) ON DELETE CASCADE | Related event (if applicable) |
| `ingredient_id` | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient affected |
| `transaction_type` | TEXT | NOT NULL | Type: initial_stock, decrement, adjustment, restock |
| `quantity_change` | DECIMAL(12,2) | NOT NULL | Amount changed (positive = add, negative = subtract) |
| `quantity_before` | DECIMAL(12,2) | NOT NULL | Quantity before transaction |
| `quantity_after` | DECIMAL(12,2) | NOT NULL | Quantity after transaction |
| `reason` | TEXT | nullable | Reason: order_completed, waste, manual_adjustment, etc. |
| `order_item_id` | UUID | nullable, FK → order_items(id) ON DELETE SET NULL | Related order item (if decrement) |
| `created_by` | TEXT | nullable | User ID or 'system' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Transaction timestamp |

**Indexes:**
- `idx_inventory_transactions_event_id` - Query by event
- `idx_inventory_transactions_ingredient_id` - Query by ingredient
- `idx_inventory_transactions_order_item_id` - Query by order item

**Business Rules:**
- All inventory changes must create a transaction record
- Automatic decrements set created_by = 'system'
- quantity_before + quantity_change = quantity_after (enforced by function)
- Transactions are immutable (no updates or deletes)

**Used By:** Web ERP (reporting), KDS (via decrement_stock function)

---

### low_stock_alerts

Active alerts for ingredients below reorder level.

**Purpose:** Notify staff when ingredients need to be reordered.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique alert identifier |
| `event_id` | UUID | NOT NULL, FK → events(id) ON DELETE CASCADE | Event with low stock |
| `ingredient_id` | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient below reorder level |
| `current_level` | DECIMAL(12,2) | NOT NULL | Current stock quantity |
| `reorder_level` | DECIMAL(12,2) | NOT NULL | Threshold that triggered alert |
| `acknowledged` | BOOLEAN | DEFAULT FALSE | Whether alert has been reviewed |
| `acknowledged_at` | TIMESTAMPTZ | nullable | When alert was acknowledged |
| `acknowledged_by` | TEXT | nullable | User who acknowledged alert |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Alert creation timestamp |
| UNIQUE(`event_id`, `ingredient_id`) | | | One alert per ingredient per event |

**Indexes:**
- `idx_low_stock_alerts_event_id` - Query by event
- `idx_low_stock_alerts_acknowledged` - Filter unacknowledged alerts

**Business Rules:**
- Alerts auto-created when stock falls below reorder_level
- Acknowledging alert doesn't delete it (historical record)
- Alert resets to unacknowledged if stock drops again after acknowledgment
- Deleting event cascades to delete alerts

**Used By:** Web ERP

---

## CRM & Staff Management Tables

The ERP system manages client relationships, staff information, and event assignments.

### clients

Client CRM database for managing customer relationships.

**Purpose:** Store comprehensive client information for marketing, sales, and event planning.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique client identifier |
| `name` | VARCHAR(255) | NOT NULL | Client name or company name |
| `email` | VARCHAR(255) | nullable | Primary email address |
| `phone` | VARCHAR(50) | nullable | Primary phone number |
| `company` | VARCHAR(255) | nullable | Company name (if different from name) |
| `contact_person` | VARCHAR(255) | nullable | Primary contact person |
| `address` | TEXT | nullable | Street address |
| `city` | VARCHAR(100) | nullable | City |
| `state` | VARCHAR(50) | nullable | State/province |
| `zip_code` | VARCHAR(20) | nullable | Postal code |
| `country` | VARCHAR(100) | DEFAULT 'USA' | Country |
| `client_type` | VARCHAR(50) | DEFAULT 'individual' | Type: individual, corporate, government |
| `status` | VARCHAR(50) | DEFAULT 'active' | Status: active, inactive, archived |
| `satisfaction_rating` | INTEGER | CHECK (1-5) | Client satisfaction score |
| `lifetime_value` | DECIMAL(12,2) | DEFAULT 0 | Total revenue from client |
| `total_events` | INTEGER | DEFAULT 0 | Number of events booked |
| `notes` | TEXT | nullable | Internal notes about client |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_clients_email` - Email lookups
- `idx_clients_status` - Filter by status
- `idx_clients_type` - Filter by client type

**Business Rules:**
- Client name is required, all other fields optional
- Satisfaction rating 1-5 (1=poor, 5=excellent)
- Lifetime value and total events updated automatically when events complete
- Status 'archived' for clients no longer active but historical data retained

**Used By:** Web ERP

---

### client_events

Historical record of client event relationships.

**Purpose:** Track which clients are associated with which events for CRM analysis.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique relationship identifier |
| `client_id` | UUID | FK → clients(id) ON DELETE CASCADE | Client |
| `event_id` | UUID | nullable | Event (FK constraint not enforced yet) |
| `event_date` | TIMESTAMPTZ | NOT NULL | Event date |
| `revenue` | DECIMAL(12,2) | nullable | Revenue from this event |
| `satisfaction_score` | INTEGER | CHECK (1-5) | Client satisfaction for this event |
| `notes` | TEXT | nullable | Event-specific notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_client_events_client_id` - Query events by client
- `idx_client_events_event_id` - Query clients by event

**Business Rules:**
- Links clients to their event history
- Revenue and satisfaction tracked per event
- Used to calculate client lifetime value
- event_id currently nullable (FK will be added in future migration)

**Used By:** Web ERP

---

### staff

Staff member information and performance tracking.

**Purpose:** Manage employee records, roles, rates, and performance metrics.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique staff identifier |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `email` | VARCHAR(255) | UNIQUE | Email address |
| `phone` | VARCHAR(50) | nullable | Phone number |
| `role` | VARCHAR(100) | NOT NULL | Role: chef, sous_chef, line_cook, server, bartender, manager, etc. |
| `department` | VARCHAR(100) | nullable | Department: kitchen, service, management, admin |
| `status` | VARCHAR(50) | DEFAULT 'active' | Status: active, on_leave, inactive |
| `hire_date` | DATE | nullable | Date hired |
| `hourly_rate` | DECIMAL(10,2) | nullable | Hourly pay rate |
| `certification_level` | VARCHAR(50) | nullable | Level: junior, intermediate, senior, master |
| `specialties` | TEXT[] | nullable | Array of specialties (e.g., ['pastry', 'grilling']) |
| `availability` | JSONB | nullable | Weekly availability as JSON |
| `total_hours_worked` | DECIMAL(10,2) | DEFAULT 0 | Cumulative hours worked |
| `total_events_worked` | INTEGER | DEFAULT 0 | Number of events worked |
| `performance_rating` | DECIMAL(3,2) | CHECK (0-5) | Performance score |
| `notes` | TEXT | nullable | Internal notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_staff_email` - Email lookups
- `idx_staff_role` - Filter by role
- `idx_staff_status` - Filter by status

**Business Rules:**
- First name, last name, and role are required
- Email must be unique if provided
- Specialties stored as array for flexible skill tracking
- Availability stored as JSONB for complex scheduling rules
- Performance rating 0-5 (0=new, 5=exceptional)

**Used By:** Web ERP

---

### staff_assignments

Links staff members to specific events with hours and pay tracking.

**Purpose:** Track which staff worked which events and calculate payroll.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique assignment identifier |
| `staff_id` | UUID | FK → staff(id) ON DELETE CASCADE | Staff member |
| `event_id` | UUID | nullable | Event (FK constraint not enforced yet) |
| `role` | VARCHAR(100) | NOT NULL | Role for this specific event |
| `hours_worked` | DECIMAL(5,2) | nullable | Hours worked at this event |
| `pay_amount` | DECIMAL(10,2) | nullable | Total pay for this event |
| `check_in_time` | TIMESTAMPTZ | nullable | When staff checked in |
| `check_out_time` | TIMESTAMPTZ | nullable | When staff checked out |
| `notes` | TEXT | nullable | Assignment-specific notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_staff_assignments_staff_id` - Query assignments by staff
- `idx_staff_assignments_event_id` - Query staff by event

**Business Rules:**
- Staff can be assigned to multiple events
- Role for assignment may differ from staff member's primary role
- Hours calculated from check_in_time and check_out_time if not manually entered
- Pay amount = hours_worked * hourly_rate (or manually overridden)
- event_id currently nullable (FK will be added in future migration)

**Used By:** Web ERP

---

## Table Relationships

### Entity Relationship Diagram

```
┌──────────┐         ┌──────────┐         ┌─────────────┐
│ clients  │────────<│  events  │>────────│table_groups │
└──────────┘         └──────────┘         └─────────────┘
                          │                       │
                          │                       │
                          ▼                       ▼
                     ┌─────────┐         ┌───────────────┐
                     │ courses │────────<│fired_courses  │
                     └─────────┘         └───────────────┘
                          │                       │
                          │                       │
                          ▼                       ▼
                    ┌────────────┐      ┌──────────────┐
                    │ menu_items │────<─│ order_items  │
                    └────────────┘      └──────────────┘
                          │                       │
                          │                       │
                          ▼                       │
                ┌────────────────────┐            │
                │recipe_ingredients  │            │
                └────────────────────┘            │
                          │                       │
                          ▼                       │
                    ┌─────────────┐               │
                    │ ingredients │<──────────────┘
                    └─────────────┘    (via decrement_stock)
                          │
                          │
                          ▼
                  ┌──────────────┐
                  │ stock_levels │
                  └──────────────┘

┌──────────┐         ┌───────────────────┐
│  staff   │────────<│staff_assignments  │
└──────────┘         └───────────────────┘
                              │
                              │
                              ▼
                         ┌────────┐
                         │ events │
                         └────────┘
```

### Relationship Types

**One-to-Many Relationships:**
- clients → events (one client can have many events)
- events → courses (one event has many courses)
- events → table_groups (one event has many table groups)
- courses → menu_items (one course has many menu items)
- fired_courses → order_items (one fired course has many order items)
- menu_items → recipe_ingredients (one menu item uses many ingredients)
- ingredients → recipe_ingredients (one ingredient used in many recipes)
- ingredients → stock_levels (one ingredient can have multiple stock levels per event)
- staff → staff_assignments (one staff member can work many events)

**Many-to-Many Relationships:**
- events ↔ staff (via staff_assignments)
- menu_items ↔ ingredients (via recipe_ingredients)

---

## Indexes & Performance

### Index Strategy

**Primary Indexes (Automatic):**
- All `id` columns (PRIMARY KEY creates unique index)
- All UNIQUE constraints create indexes

**Foreign Key Indexes:**
- All foreign key columns indexed for join performance
- Naming convention: `idx_{table}_{column}`

**Query Optimization Indexes:**
- Status columns (events.status, staff.status, etc.)
- Date/time columns (events.event_date, events.start_time)
- Boolean flags (menu_items.is_available, low_stock_alerts.acknowledged)

### Index Maintenance

**Current Index Count:** 28 indexes across 15 tables

**Index Health Checks:**
- Run `ANALYZE` after bulk data loads
- Monitor index usage with `pg_stat_user_indexes`
- Consider dropping unused indexes identified by monitoring

---

## Security & RLS Policies

### Row Level Security (RLS)

**Status:** Enabled on all 15 tables

**Current Policy:** "Allow all" for development
- All tables have policy: `FOR ALL USING (true)`
- Allows unrestricted access for rapid development
- **MUST be restricted before production deployment**

### Production RLS Recommendations

**Role-Based Access:**
```sql
-- Example: Restrict clients table to authenticated users
CREATE POLICY "Clients access for authenticated users" 
  ON clients FOR ALL 
  USING (auth.role() = 'authenticated');

-- Example: Staff can only view their own records
CREATE POLICY "Staff view own records" 
  ON staff FOR SELECT 
  USING (auth.uid() = id::text);

-- Example: Managers can view all staff
CREATE POLICY "Managers view all staff" 
  ON staff FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'manager');
```

**Event-Based Access:**
```sql
-- Example: Staff can only see events they're assigned to
CREATE POLICY "Staff view assigned events" 
  ON events FOR SELECT 
  USING (
    id IN (
      SELECT event_id FROM staff_assignments 
      WHERE staff_id = auth.uid()::uuid
    )
  );
```

---

## Triggers & Functions

### Automatic Timestamp Updates

**Function:** `update_updated_at_column()`

**Triggers:**
- `update_events_updated_at` on events
- `update_ingredients_updated_at` on ingredients
- `update_stock_levels_updated_at` on stock_levels
- `update_clients_updated_at` on clients
- `update_staff_updated_at` on staff
- `update_fired_courses_updated_at` on fired_courses
- `update_order_items_updated_at` on order_items

**Purpose:** Automatically set `updated_at = NOW()` on every UPDATE

---

### Inventory Decrement Function

**Function:** `decrement_stock(p_event_id, p_menu_item_id, p_order_item_id, p_quantity)`

**Purpose:** Automatically decrement ingredient stock when order items complete

**Process:**
1. Look up all ingredients in recipe for menu item
2. For each ingredient:
   - Get current stock level (event-specific or general)
   - Calculate new quantity (current - recipe_quantity * order_quantity)
   - Update stock_levels table
   - Create inventory_transaction record
   - Check if below reorder level
   - Create/update low_stock_alert if needed
3. Return success status and count of alerts created

**Returns:**
```sql
TABLE(
  success BOOLEAN,
  message TEXT,
  low_stock_alerts_created INT
)
```

**Usage:**
```sql
SELECT * FROM decrement_stock(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- event_id
  '123e4567-e89b-12d3-a456-426614174001'::uuid,  -- menu_item_id
  '123e4567-e89b-12d3-a456-426614174002'::uuid,  -- order_item_id
  2                                                -- quantity
);
```

---

### Inventory Status Function

**Function:** `get_inventory_status(p_event_id)`

**Purpose:** Get current inventory status for an event with stock levels and alerts

**Returns:**
```sql
TABLE(
  ingredient_id UUID,
  ingredient_name TEXT,
  current_quantity DECIMAL,
  unit TEXT,
  reorder_level DECIMAL,
  status TEXT,  -- 'out_of_stock', 'low_stock', 'in_stock'
  cost_value DECIMAL
)
```

**Usage:**
```sql
SELECT * FROM get_inventory_status(
  '123e4567-e89b-12d3-a456-426614174000'::uuid
);
```

---

## Migration History

### Table: Migration Timeline

| # | File | Date | Purpose | Tables Affected |
|---|------|------|---------|-----------------|
| 001 | kds_schema.sql | Initial | Create KDS tables | events, courses, menu_items, table_groups, fired_courses, order_items |
| 002 | inventory_schema.sql | Initial | Create inventory system | ingredients, stock_levels, recipe_ingredients, inventory_transactions, low_stock_alerts |
| 003 | clients_staff_schema.sql | Initial | Create CRM/staff tables | clients, client_events, staff, staff_assignments |
| 004 | update_events_schema.sql | 2026-01-09 | Add web ERP event fields | events |
| 005 | update_menu_items_schema.sql | 2026-01-09 | Add web ERP menu fields | menu_items |
| 006 | make_station_nullable.sql | 2026-01-09 | Remove station constraint | menu_items |
| 007 | enable_rls_clients_staff.sql | 2026-01-09 | Enable RLS on CRM tables | clients, client_events, staff, staff_assignments |

### Migration Best Practices

1. **Always use IF NOT EXISTS** for CREATE statements
2. **Use ALTER COLUMN for schema changes** instead of DROP/ADD
3. **Create indexes after data loads** for better performance
4. **Test migrations on copy of production data** before applying
5. **Include rollback scripts** for all destructive changes
6. **Document business context** in migration comments

---

## Appendix: Sample Queries

### Get Event with Full Details
```sql
SELECT 
  e.*,
  c.name as client_name,
  c.email as client_email,
  COUNT(DISTINCT co.id) as course_count,
  COUNT(DISTINCT mi.id) as menu_item_count
FROM events e
LEFT JOIN clients c ON c.id = e.client_id
LEFT JOIN courses co ON co.event_id = e.id
LEFT JOIN menu_items mi ON mi.course_id = co.id
WHERE e.id = '...'
GROUP BY e.id, c.id;
```

### Get Active Orders by Kitchen Station
```sql
SELECT 
  oi.station,
  mi.name as dish_name,
  oi.quantity,
  oi.modifications,
  oi.status,
  oi.fired_at,
  EXTRACT(EPOCH FROM (NOW() - oi.fired_at))/60 as minutes_cooking
FROM order_items oi
JOIN menu_items mi ON mi.id = oi.menu_item_id
JOIN fired_courses fc ON fc.id = oi.fired_course_id
WHERE fc.event_id = '...'
  AND oi.status IN ('queued', 'cooking')
ORDER BY oi.station, oi.fired_at;
```

### Get Low Stock Ingredients
```sql
SELECT 
  i.name,
  i.unit,
  sl.quantity as current_stock,
  i.reorder_level,
  i.supplier
FROM ingredients i
JOIN stock_levels sl ON sl.ingredient_id = i.id
WHERE sl.event_id = '...'
  AND sl.quantity < i.reorder_level
ORDER BY (sl.quantity / i.reorder_level) ASC;
```

### Calculate Menu Item Cost
```sql
SELECT 
  mi.name,
  mi.price_per_serving,
  SUM(ri.quantity * i.cost_per_unit) as cost_per_serving,
  mi.price_per_serving - SUM(ri.quantity * i.cost_per_unit) as profit_per_serving,
  ((mi.price_per_serving - SUM(ri.quantity * i.cost_per_unit)) / mi.price_per_serving * 100) as profit_margin_pct
FROM menu_items mi
JOIN recipe_ingredients ri ON ri.menu_item_id = mi.id
JOIN ingredients i ON i.id = ri.ingredient_id
WHERE mi.id = '...'
GROUP BY mi.id;
```

---

**Document Maintenance:**
- Update this document when schema changes are made
- Review quarterly for accuracy
- Link to migration files for detailed change history
- Coordinate updates with API documentation

---

**End of Database Schema Documentation**
