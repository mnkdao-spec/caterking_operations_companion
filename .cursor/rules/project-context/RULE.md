---
description: "CaterKing Operations Companion project overview, architecture, tech stack, and key patterns"
alwaysApply: true
---

# CaterKing Operations Companion - Project Context

## Project Overview

CaterKing Operations Companion is a full-stack catering ERP platform:

1. **Mobile App** (React Native/Expo) - Kitchen Display System (KDS) and operations companion
2. **Web ERP** (Next.js) - Desktop business management dashboard
3. **Backend Server** (Express + tRPC) - API layer with type-safe RPC
4. **Database** (PostgreSQL/Supabase) - Real-time synchronized database

**Repository:** [github.com/mnkdao-spec/caterking_operations_companion](https://github.com/mnkdao-spec/caterking_operations_companion)

## Technology Stack

**Mobile App:**
- Expo Router (~6.0.19) with React Native (0.81.5)
- TypeScript 5.9.3
- NativeWind 4.2.1 (Tailwind for React Native)
- React Query + Context API
- tRPC 11.7.2
- Supabase Realtime

**Web ERP:**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase client

**Backend:**
- Express 4.22.1
- tRPC 11.7.2
- Drizzle ORM (schema definition only)
- Supabase PostgreSQL (actual database)

## Database

**Total Tables:** 15 tables across:
- KDS System (6 tables): events, courses, menu_items, table_groups, fired_courses, order_items
- Inventory (5 tables): ingredients, stock_levels, recipe_ingredients, inventory_transactions, low_stock_alerts
- CRM/Staff (4 tables): clients, client_events, staff, staff_assignments

**Migrations:** Run via Supabase SQL Editor (not Drizzle CLI)

**Documentation:** See `docs/database_schema.md` for complete schema

## Key Architecture Patterns

**Data Flow:**
1. Event Creation (Web ERP) → Events table
2. Course Firing (Mobile KDS) → fired_courses → order_items
3. Order Completion → Triggers inventory decrement
4. Real-time Updates → Supabase Realtime → All devices

**State Management:**
- React Query for server state (mobile)
- Context API for global client state (KDS context)
- AsyncStorage for offline persistence
- Supabase Realtime for live updates

**Service Layer:**
- Mobile: `lib/supabase-kds.ts`
- Web: `web/lib/supabase-services.ts`
- Backend: `server/routers.ts` (tRPC)

## Important Files

- `DEVELOPER_GUIDE.md` - Comprehensive developer reference
- `PROJECT_RULES.md` - Complete project rules and standards
- `docs/database_schema.md` - Database documentation
- `docs/naming_conventions.md` - Naming standards
- `todo.md` - Current task list

## Common Commands

```bash
pnpm dev              # Start all dev servers
pnpm check            # TypeScript type checking
pnpm lint             # ESLint
pnpm format           # Prettier formatting
pnpm test             # Run tests
```

## Development Workflow

When adding features:
1. Create migration (if database changes)
2. Create service functions
3. Create components
4. Add routes/pages
5. Update documentation

**Reference:** See `DEVELOPER_GUIDE.md` for detailed workflows
