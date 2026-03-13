# CaterKing Operations Companion - Developer Guide

**Last Updated:** January 2026  
**Purpose:** Complete reference for developers continuing work on this project

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Key Features & Implementation](#key-features--implementation)
7. [Development Workflow](#development-workflow)
8. [API & Services](#api--services)
9. [Configuration & Environment](#configuration--environment)
10. [Testing & Quality](#testing--quality)
11. [Deployment](#deployment)
12. [Common Tasks](#common-tasks)

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 9.12.0 (`npm install -g pnpm@9.12.0`)
- **Supabase Account** (optional - app works in mock mode)
- **Git** for version control

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/mnkdao-spec/caterking_operations_companion.git
cd caterking_operations_companion

# Install dependencies
pnpm install

# Copy environment template (if needed)
cp .env.example .env  # Edit with your credentials

# Start development servers
pnpm dev  # Runs both backend (port 3000) and mobile app (port 8081)

# In separate terminal, start web ERP (if needed)
cd web && pnpm dev  # Runs on port 3000 (or next available)
```

### Running Individual Services

```bash
# Backend server only
pnpm dev:server

# Mobile app (Expo Metro) only
pnpm dev:metro

# Web ERP only (from web directory)
cd web && pnpm dev

# Type checking
pnpm check

# Linting
pnpm lint

# Testing
pnpm test
```

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                        │
│  React Native + Expo Router + NativeWind                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Events   │  │ Alerts   │  │ Tasks    │  │Inventory │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         KDS System (Expo, Stations, Plating)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ tRPC (type-safe RPC)
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (Express + tRPC)                │
│  Node.js + Express + tRPC 11.7.2                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Auth     │  │ KDS API  │  │ Inventory│  │ Staff    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ Supabase Client
┌─────────────────────────────────────────────────────────────┐
│              Web ERP (Next.js 15)                           │
│  React + Next.js App Router + Tailwind CSS                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │ Events   │  │ Clients  │  │ Inventory│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Staff    │  │ Menus    │  │ Invoices │  │ Reports  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ Supabase Client + Realtime
┌─────────────────────────────────────────────────────────────┐
│            Supabase (PostgreSQL 15 + Realtime)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 15 Tables: events, courses, menu_items, ingredients  │  │
│  │ staff, clients, inventory, invoices, etc.            │  │
│  │ 14 Migration Files + Functions + Triggers + RLS      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Event Creation (Web ERP)** → Events table in Supabase
2. **Course Firing (Mobile KDS)** → fired_courses → order_items
3. **Order Completion** → Triggers inventory decrement function
4. **Inventory Decrement** → Updates stock_levels + creates transactions + checks alerts
5. **Real-time Updates** → Supabase Realtime → All connected devices

### Key Design Decisions

1. **Type Safety:** End-to-end TypeScript with tRPC for type-safe RPC calls
2. **Real-time Sync:** Supabase Realtime subscriptions for live updates
3. **Dual Schema:** Drizzle ORM defines MySQL schema, but actual DB is Supabase PostgreSQL
4. **State Management:** React Query for server state, Context API for client state
5. **Offline Support:** AsyncStorage for local persistence, syncs when online
6. **Mock Mode:** App works without Supabase credentials using mock data

---

## Technology Stack

### Mobile App (`app/` directory)

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | ~54.0.29 | React Native framework |
| Expo Router | ~6.0.19 | File-based routing |
| React Native | 0.81.5 | Mobile UI framework |
| React | 19.1.0 | UI library |
| TypeScript | ~5.9.3 | Type safety |
| NativeWind | ^4.2.1 | Tailwind CSS for React Native |
| React Query | ^5.90.12 | Server state management |
| tRPC Client | 11.7.2 | Type-safe API client |
| Supabase JS | ^2.90.1 | Database client + Realtime |
| AsyncStorage | ^2.2.0 | Local persistence |

### Web ERP (`web/` directory)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | Latest | React framework |
| React | Latest | UI library |
| TypeScript | Latest | Type safety |
| Tailwind CSS | ^3.4.17 | Utility-first CSS |
| Supabase JS | ^2.90.1 | Database client |

### Backend Server (`server/` directory)

| Technology | Version | Purpose |
|------------|---------|---------|
| Express | ^4.22.1 | HTTP server |
| tRPC Server | 11.7.2 | Type-safe API layer |
| Node.js | LTS | Runtime |
| TypeScript | ~5.9.3 | Type safety |
| Drizzle ORM | ^0.44.7 | Database ORM (schema definition) |
| Superjson | ^1.13.3 | JSON serialization |
| Zod | ^4.2.1 | Schema validation |

### Database

| Technology | Details | Purpose |
|------------|---------|---------|
| Supabase | PostgreSQL 15+ | Primary database |
| PostgREST | Built-in | REST API |
| Realtime | Built-in | WebSocket subscriptions |
| RLS | Enabled | Row Level Security |

### Development Tools

- **Package Manager:** pnpm 9.12.0
- **Linter:** ESLint 9.39.2
- **Formatter:** Prettier 3.7.4
- **Testing:** Vitest 2.1.9
- **Type Checker:** TypeScript compiler

---

## Project Structure

### Directory Layout

```
caterking_operations_companion/
│
├── app/                          # Mobile app (Expo Router)
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                  # Tab navigation screens
│   │   ├── _layout.tsx          # Tab bar layout
│   │   ├── index.tsx            # Today's Events
│   │   ├── alerts.tsx           # Kitchen Alerts
│   │   ├── tasks.tsx            # Event Checklist
│   │   └── inventory.tsx        # Inventory Quick-Check
│   ├── kds/                     # Kitchen Display System
│   │   ├── _layout.tsx          # KDS layout
│   │   ├── index.tsx            # Mode selector (Phone/Tablet)
│   │   ├── expo.tsx             # Expo/Command station
│   │   ├── station.tsx          # Station queue view
│   │   └── plating.tsx          # Plating/Ready view
│   ├── oauth/                   # OAuth callback handler
│   │   └── callback.tsx
│   └── dev/                     # Development tools
│       └── theme-lab.tsx
│
├── web/                         # Web ERP (Next.js)
│   ├── app/                     # Next.js app directory
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Dashboard
│   │   ├── events/              # Event Management
│   │   ├── clients/             # CRM
│   │   ├── staff/               # Staff Management
│   │   ├── menus/               # Menu Builder
│   │   ├── inventory/           # Inventory Management
│   │   ├── invoices/            # Invoice Generation
│   │   ├── schedule/            # Staff Scheduling
│   │   └── reports/             # Financial Reports
│   ├── components/              # React components
│   │   ├── dashboard-layout.tsx
│   │   ├── navigation.tsx
│   │   ├── modal.tsx
│   │   ├── event-form.tsx
│   │   ├── client-form.tsx
│   │   ├── staff-form.tsx
│   │   └── menu-item-form.tsx
│   ├── lib/                     # Utilities
│   │   ├── supabase.ts          # Supabase client
│   │   ├── supabase-services.ts # Service layer
│   │   └── utils.ts
│   └── package.json
│
├── server/                      # Backend server
│   ├── _core/                   # Core infrastructure
│   │   ├── index.ts             # Express server setup
│   │   ├── trpc.ts              # tRPC configuration
│   │   ├── context.ts           # tRPC context
│   │   ├── cookies.ts           # Cookie utilities
│   │   ├── env.ts               # Environment variables
│   │   └── systemRouter.ts      # System routes
│   ├── routers.ts               # Main tRPC router
│   ├── db.ts                    # Database query helpers
│   ├── storage.ts               # S3 storage helpers
│   └── README.md
│
├── lib/                         # Shared libraries (mobile)
│   ├── _core/                   # Core utilities
│   ├── trpc.ts                  # tRPC client setup
│   ├── supabase-client.ts       # Supabase client config
│   ├── supabase-kds.ts          # KDS service layer
│   ├── kds-context-realtime.tsx # KDS real-time context
│   └── theme-provider.tsx       # Theme provider
│
├── components/                  # Shared React components
│   ├── ui/                      # UI components
│   ├── themed-view.tsx
│   ├── screen-container.tsx
│   └── haptic-tab.tsx
│
├── hooks/                       # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   ├── use-color-scheme.ts      # Theme hook
│   └── use-colors.ts
│
├── constants/                   # App constants
│   ├── const.ts
│   ├── oauth.ts                 # OAuth configuration
│   └── theme.ts                 # Theme colors
│
├── shared/                      # Shared code
│   ├── types.ts                 # Shared TypeScript types
│   └── const.ts                 # Shared constants
│
├── drizzle/                     # Database schema (Drizzle ORM)
│   ├── schema.ts                # MySQL schema definitions
│   ├── relations.ts             # Table relationships
│   ├── migrations/              # Generated migrations
│   └── 0000_elite_eternals.sql
│
├── supabase/                    # Supabase migrations (actual DB)
│   └── migrations/              # 14 SQL migration files
│       ├── 001_kds_schema.sql
│       ├── 002_inventory_schema.sql
│       ├── 003_clients_staff_schema.sql
│       └── ... (11 more migrations)
│
├── docs/                        # Documentation
│   ├── database_schema.md       # Complete DB schema docs
│   ├── data_dictionary.md       # Business terms reference
│   ├── naming_conventions.md    # Code standards
│   └── migration_checklist.md   # Migration procedures
│
├── scripts/                     # Utility scripts
│   ├── generate_qr.mjs          # QR code generation
│   ├── load-env.js              # Environment loader
│   └── reset-project.js
│
├── tests/                       # Test files
│   └── auth.logout.test.ts
│
├── __tests__/                   # More tests
│   ├── app.test.ts
│   ├── inventory.test.ts
│   └── kds.test.ts
│
├── assets/                      # Static assets
│   └── images/                  # App icons and images
│
├── app.config.ts                # Expo configuration
├── package.json                 # Root package.json
├── pnpm-lock.yaml               # Dependency lockfile
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind config
├── babel.config.js              # Babel config
├── metro.config.js              # Metro bundler config
├── eslint.config.js             # ESLint config
│
├── README.md                    # (if exists)
├── todo.md                      # Comprehensive task list
├── design.md                    # Mobile app design specs
├── design-kds.md                # KDS system design
├── SUPABASE_SETUP.md            # Supabase setup guide
├── INVENTORY_INTEGRATION.md     # Inventory docs
└── KDS_REALTIME_SETUP.md        # Real-time setup guide
```

### Key Files Reference

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with tRPC, React Query, KDS Context providers |
| `app.config.ts` | Expo app configuration (bundle ID, deep linking, etc.) |
| `server/_core/index.ts` | Express server with tRPC middleware |
| `server/routers.ts` | tRPC API route definitions |
| `lib/trpc.ts` | tRPC client configuration for mobile |
| `lib/kds-context-realtime.tsx` | KDS real-time state management |
| `lib/supabase-kds.ts` | KDS service layer (CRUD operations) |
| `web/lib/supabase-services.ts` | Web ERP service layer |
| `drizzle/schema.ts` | Database schema definition (MySQL, but using PostgreSQL) |
| `supabase/migrations/` | Actual database migrations (PostgreSQL) |

---

## Database Schema

### Overview

- **Total Tables:** 15
- **Total Migrations:** 14 SQL files
- **Database:** PostgreSQL 15+ (via Supabase)
- **Features:** RLS enabled, Realtime enabled on key tables

### Table Categories

#### 1. Core KDS Tables (6 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `events` | Event information | `id`, `name`, `client_id`, `event_date`, `status`, `budget` |
| `courses` | Meal courses for events | `id`, `event_id`, `course_number`, `name` |
| `menu_items` | Master dish list | `id`, `course_id`, `name`, `station`, `price_per_serving` |
| `table_groups` | Groups of tables | `id`, `event_id`, `name`, `table_numbers[]`, `guest_count` |
| `fired_courses` | Track fired courses | `id`, `event_id`, `course_id`, `table_group_id`, `status`, `fired_at` |
| `order_items` | Individual dishes | `id`, `fired_course_id`, `menu_item_id`, `quantity`, `station`, `status` |

#### 2. Inventory Management Tables (5 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `ingredients` | Master ingredient list | `id`, `name`, `unit`, `cost_per_unit`, `reorder_level` |
| `stock_levels` | Current inventory | `id`, `ingredient_id`, `event_id`, `quantity` |
| `recipe_ingredients` | Menu-to-ingredient mapping | `id`, `menu_item_id`, `ingredient_id`, `quantity` |
| `inventory_transactions` | Audit trail | `id`, `ingredient_id`, `transaction_type`, `quantity_change` |
| `low_stock_alerts` | Active alerts | `id`, `event_id`, `ingredient_id`, `current_level`, `acknowledged` |

#### 3. CRM & Staff Management Tables (4 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `clients` | Client database | `id`, `name`, `email`, `client_type`, `lifetime_value` |
| `client_events` | Client-event history | `id`, `client_id`, `event_id`, `revenue`, `satisfaction_score` |
| `staff` | Employee records | `id`, `first_name`, `last_name`, `role`, `hourly_rate` |
| `staff_assignments` | Event assignments | `id`, `staff_id`, `event_id`, `hours_worked`, `pay_amount` |

### Database Functions

1. **`decrement_stock(p_event_id, p_menu_item_id, p_order_item_id, p_quantity)`**
   - Automatically decrements inventory when orders complete
   - Creates transaction records
   - Generates low stock alerts

2. **`get_inventory_status(p_event_id)`**
   - Returns inventory status with alerts
   - Calculates stock levels and costs

3. **`check_staff_conflicts(p_staff_id, p_event_id)`**
   - Detects overlapping staff assignments
   - Returns conflict information

### Relationships

```
clients (1) ──< events (1) ──< courses (1) ──< menu_items
                                    │
                                    └──< table_groups (1) ──< fired_courses (1) ──< order_items
                                                                                        │
                                                                                        └──> menu_items
                                                                                                │
                                                                                                └──> recipe_ingredients
                                                                                                        │
                                                                                                        └──> ingredients (1) ──< stock_levels
                                                                                                                │
                                                                                                                └──< inventory_transactions
                                                                                                                └──< low_stock_alerts

staff (1) ──< staff_assignments (many) ──> events
```

### Migration Files

All migrations are in `supabase/migrations/`:

1. `001_kds_schema.sql` - Core KDS tables
2. `002_inventory_schema.sql` - Inventory system
3. `003_clients_staff_schema.sql` - CRM/staff tables
4. `004_update_events_schema.sql` - Web ERP event fields
5. `005_update_menu_items_schema.sql` - Web ERP menu fields
6. `006_make_station_nullable.sql` - Schema flexibility
7. `007_enable_rls_clients_staff.sql` - Security
8. `008_staff_availability.sql` - Availability tracking
9-14. Various fixes and improvements

**Note:** Run migrations via Supabase SQL Editor, not via Drizzle CLI (Drizzle is for schema definition only).

---

## Key Features & Implementation

### Mobile App Features

#### 1. Today's Events (`app/(tabs)/index.tsx`)
- **Status:** ✅ Complete
- **Functionality:** View today's events, event details, quick actions
- **Data Source:** Supabase `events` table (or mock data)
- **Real-time:** Subscribed to events table updates

#### 2. Kitchen Alerts (`app/(tabs)/alerts.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Real-time alert feed, filter by type, dismiss alerts
- **Data Source:** `low_stock_alerts` table (or mock data)
- **Storage:** AsyncStorage for local persistence

#### 3. Event Checklist (`app/(tabs)/tasks.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Task management, completion tracking, progress indicators
- **Data Source:** Local state + AsyncStorage (could integrate with events)

#### 4. Inventory Quick-Check (`app/(tabs)/inventory.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Searchable inventory, QR scanner placeholder, stock levels
- **Data Source:** `stock_levels` + `ingredients` tables

#### 5. KDS Mode Selector (`app/kds/index.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Choose Phone/Staff mode vs Tablet/Station mode
- **Navigation:** Routes to appropriate screens

#### 6. Expo/Command Station (`app/kds/expo.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Fire courses to kitchen, monitor all stations, view table groups
- **Data Source:** `events`, `courses`, `table_groups`, `fired_courses`
- **Real-time:** Subscribed to fired_courses updates

#### 7. Station Queue View (`app/kds/station.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Display orders by station, large bump buttons, timer indicators
- **Data Source:** `order_items` filtered by station
- **Real-time:** Subscribed to order_items updates

#### 8. Plating View (`app/kds/plating.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Track course completion, mark as plated/served
- **Data Source:** `fired_courses` with status tracking

### Web ERP Features

#### 1. Dashboard (`web/app/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Revenue analytics, KPIs, recent events, upcoming events
- **Data Source:** Aggregated from `events`, `clients`, `staff_assignments`

#### 2. Event Management (`web/app/events/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** CRUD operations, calendar view, event details
- **Components:** `components/event-form.tsx` for create/edit modal
- **Data Source:** `events` table

#### 3. Client CRM (`web/app/clients/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Client database, contact info, lifetime value, event history
- **Components:** `components/client-form.tsx`
- **Data Source:** `clients`, `client_events` tables

#### 4. Staff Management (`web/app/staff/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Employee records, roles, rates, performance tracking
- **Components:** `components/staff-form.tsx`
- **Data Source:** `staff`, `staff_assignments` tables

#### 5. Menu Builder (`web/app/menus/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Create menu items, assign to courses, set pricing, link recipes
- **Components:** `components/menu-item-form.tsx`
- **Data Source:** `menu_items`, `recipe_ingredients` tables

#### 6. Inventory Management (`web/app/inventory/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Track ingredients, stock levels, suppliers, purchase orders
- **Data Source:** `ingredients`, `stock_levels`, `inventory_transactions` tables

#### 7. Staff Scheduling (`web/app/schedule/page.tsx`)
- **Status:** ✅ Mostly Complete
- **Functionality:** Weekly calendar view, staff assignments, conflict detection
- **Pending:** Drag-and-drop assignment, availability table
- **Data Source:** `staff_assignments`, `events` tables

#### 8. Invoice Generation (`web/app/invoices/page.tsx`)
- **Status:** ✅ Complete (needs testing)
- **Functionality:** Auto-generate invoices from completed events, calculate labor costs
- **Data Source:** `events`, `staff_assignments`, `invoices` table
- **Function:** Calculates costs, tax, total amounts

#### 9. Financial Reports (`web/app/reports/page.tsx`)
- **Status:** ✅ Complete
- **Functionality:** Profit analysis, revenue tracking, cost breakdowns
- **Data Source:** Aggregated from multiple tables

---

## Development Workflow

### Adding a New Feature

1. **Database Changes:**
   - Create migration in `supabase/migrations/XXXX_description.sql`
   - Update `docs/database_schema.md` if needed
   - Run migration in Supabase SQL Editor

2. **Service Layer:**
   - Add service functions in `lib/supabase-kds.ts` (mobile) or `web/lib/supabase-services.ts` (web)
   - Create TypeScript types/interfaces

3. **UI Components:**
   - Create React components in `components/` or `web/components/`
   - Use existing patterns (Modal, Forms, etc.)

4. **Screen/Page:**
   - Mobile: Create screen in `app/` directory (Expo Router)
   - Web: Create page in `web/app/` directory (Next.js App Router)

5. **State Management:**
   - Server state: Use React Query (mobile) or direct Supabase calls (web)
   - Client state: Use Context API or local state

6. **Real-time (if needed):**
   - Add Supabase Realtime subscription in context or component
   - Update state on changes

### Code Style Guidelines

- **TypeScript:** Strict mode enabled, no `any` types
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Files:** One component per file, match filename to export
- **Imports:** Use path aliases (`@/` for root, `@shared/` for shared code)
- **Formatting:** Prettier auto-format on save

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push and create PR: `git push origin feature/your-feature`
4. Merge after review

---

## API & Services

### tRPC API (Backend Server)

**Location:** `server/routers.ts`

Currently minimal implementation:
- `auth.me` - Get current user
- `auth.logout` - Logout user
- `system.*` - System routes (notification, etc.)

**TODO:** Add feature routers (KDS, Inventory, etc.)

### Supabase Services (Direct Client)

#### Mobile App (`lib/supabase-kds.ts`)

Services available:
- `eventsService` - Event CRUD operations
- `firedCoursesService` - Course firing operations
- `orderItemsService` - Order item operations
- `tableGroupsService` - Table group operations
- `coursesService` - Course operations

**Example:**
```typescript
import { eventsService } from '@/lib/supabase-kds';

const event = await eventsService.getActiveEvent();
```

#### Web ERP (`web/lib/supabase-services.ts`)

Services available:
- `getEvents()`, `getEventById()` - Event operations
- `getClients()`, `getClientById()` - Client operations
- `getMenuItems()` - Menu operations
- `getInventoryItems()` - Inventory operations
- `getStaff()`, `getStaffById()` - Staff operations
- CRUD functions for all entities

**Example:**
```typescript
import { getEvents, createEvent } from '@/lib/supabase-services';

const events = await getEvents();
const newEvent = await createEvent({ ... });
```

### Real-time Subscriptions

**Mobile App:** Uses `KDSRealtimeProvider` context (`lib/kds-context-realtime.tsx`)

**Web ERP:** Direct Supabase subscriptions in components

**Example:**
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('events')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
        // Handle update
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Configuration & Environment

### Environment Variables

#### Mobile App (.env)

```env
# Supabase (optional - app works in mock mode)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key-here

# Manus OAuth (if using auth)
EXPO_PUBLIC_APP_ID=your-manus-app-id
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_OAUTH_PORTAL_URL=your-oauth-portal-url

# Development
EXPO_PORT=8081
```

#### Backend Server (.env)

```env
# Database (not used - using Supabase directly)
DATABASE_URL=mysql://... (ignored)

# Auth
JWT_SECRET=your-jwt-secret-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=your-oauth-server-url
VITE_OAUTH_PORTAL_URL=your-oauth-portal-url
OWNER_OPEN_ID=owner-open-id

# Server
PORT=3000

# Manus Platform (optional)
BUILT_IN_FORGE_API_URL=your-forge-api-url
BUILT_IN_FORGE_API_KEY=your-forge-api-key
```

#### Web ERP (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-anon-key-here
```

### Configuration Files

| File | Purpose | Key Settings |
|------|---------|--------------|
| `app.config.ts` | Expo app config | Bundle ID, scheme, icons, permissions |
| `tsconfig.json` | TypeScript config | Path aliases, strict mode |
| `tailwind.config.js` | Tailwind CSS config | Custom colors, theme |
| `drizzle.config.ts` | Drizzle ORM config | Database connection (MySQL - not used) |
| `web/next.config.ts` | Next.js config | Build settings |

### Supabase Setup

See `SUPABASE_SETUP.md` for detailed instructions.

**Quick Setup:**
1. Create Supabase project
2. Run migrations from `supabase/migrations/` in SQL Editor
3. Enable Realtime on key tables
4. Add credentials to `.env` files

---

## Testing & Quality

### Test Framework

- **Framework:** Vitest 2.1.9
- **Location:** `tests/` and `__tests__/`
- **Run:** `pnpm test`

### Current Tests

- `tests/auth.logout.test.ts` - Auth logout functionality
- `__tests__/app.test.ts` - App tests
- `__tests__/inventory.test.ts` - Inventory tests
- `__tests__/kds.test.ts` - KDS tests

### Quality Checks

```bash
pnpm check    # TypeScript type checking
pnpm lint     # ESLint
pnpm format   # Prettier formatting
pnpm test     # Run tests
```

### Adding Tests

Create test files in `tests/` or `__tests__/`:

```typescript
import { describe, expect, it } from "vitest";

describe("Feature Name", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });
});
```

---

## Deployment

### Mobile App (Expo)

1. **Development Build:**
   ```bash
   npx expo prebuild
   npx expo run:ios  # or run:android
   ```

2. **Production Build:**
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

3. **Publish Updates:**
   ```bash
   eas update --branch production
   ```

### Web ERP (Next.js)

1. **Build:**
   ```bash
   cd web
   pnpm build
   ```

2. **Deploy:**
   - Vercel (recommended): Connect GitHub repo
   - Other platforms: Use `pnpm start` for production server

### Backend Server

1. **Build:**
   ```bash
   pnpm build
   ```

2. **Start:**
   ```bash
   pnpm start
   ```

3. **Deploy:**
   - Manus Platform (if using)
   - Other: Deploy Node.js app (Railway, Render, etc.)

---

## Common Tasks

### Adding a New Database Table

1. Create migration file: `supabase/migrations/015_add_table_name.sql`
2. Define schema with CREATE TABLE
3. Add indexes for foreign keys and common queries
4. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
5. Create policy: `CREATE POLICY "Allow all" ON table_name FOR ALL USING (true);` (dev mode)
6. Enable Realtime if needed: Via Supabase dashboard
7. Update `docs/database_schema.md`

### Adding a New Mobile Screen

1. Create file in `app/` directory: `app/new-screen.tsx`
2. Use Expo Router navigation: `import { router } from 'expo-router';`
3. Follow existing patterns for styling (NativeWind/Tailwind)
4. Add to navigation if needed (tab bar or stack)

### Adding a New Web ERP Page

1. Create directory in `web/app/`: `web/app/new-page/page.tsx`
2. Use Next.js App Router conventions
3. Follow existing dashboard layout pattern
4. Add to navigation: `web/components/navigation.tsx`

### Implementing Real-time Updates

1. Create Supabase channel in component or context
2. Subscribe to table changes
3. Update local state on changes
4. Clean up subscription on unmount

**Example:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('table-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'your_table' },
      (payload) => {
        setData(prev => updateState(prev, payload));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Debugging

**Mobile App:**
- Use React Native Debugger
- Console logs appear in Metro bundler terminal
- Use `console.log()` for debugging

**Web ERP:**
- Use browser DevTools
- React DevTools extension
- Next.js error overlay in development

**Backend:**
- Console logs in server terminal
- Use `console.log()` or `console.error()`

**Database:**
- Use Supabase SQL Editor
- Check Supabase logs in dashboard
- Query tables directly for debugging

---

## Resources & Documentation

### Internal Documentation

- `todo.md` - Comprehensive task list
- `design.md` - Mobile app design specifications
- `design-kds.md` - KDS system design
- `docs/database_schema.md` - Complete database documentation
- `docs/data_dictionary.md` - Business terminology reference
- `docs/naming_conventions.md` - Code standards
- `SUPABASE_SETUP.md` - Supabase configuration guide
- `INVENTORY_INTEGRATION.md` - Inventory system docs
- `KDS_REALTIME_SETUP.md` - Real-time setup guide

### External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## Support & Contribution

### Getting Help

1. Check documentation files in `docs/`
2. Review existing code patterns
3. Check GitHub issues (if repository is public)
4. Review TODO list in `todo.md` for known tasks

### Contributing

1. Follow code style guidelines
2. Write tests for new features
3. Update documentation as needed
4. Submit PRs with clear descriptions

---

**Last Updated:** January 2026  
**Maintained By:** Development Team
