# CaterKing Operations Companion - Quick Start Guide

**Last Updated:** January 2026

This is a quick reference guide for developers starting work on the CaterKing Operations Companion project. For comprehensive documentation, see `DEVELOPER_GUIDE.md`.

---

## 🚀 Getting Started (5 Minutes)

### 1. Clone & Install

```bash
git clone https://github.com/mnkdao-spec/caterking_operations_companion.git
cd caterking_operations_companion
pnpm install
```

### 2. Set Up Environment Variables

Create `.env` file in root:

```env
# Supabase (optional - app works in mock mode)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key

# Backend Server (optional)
JWT_SECRET=your-secret
PORT=3000
```

### 3. Start Development Servers

```bash
# Start both mobile app and backend server
pnpm dev

# Or start individually:
pnpm dev:server   # Backend on port 3000
pnpm dev:metro    # Mobile app on port 8081

# Web ERP (separate terminal):
cd web && pnpm dev
```

### 4. Access Applications

- **Mobile App:** Open `http://localhost:8081` in browser or use Expo Go app
- **Web ERP:** Open `http://localhost:3000` (or next available port)
- **Backend API:** `http://localhost:3000/api/trpc`

---

## 📁 Project Structure at a Glance

```
├── app/              # Mobile app (Expo Router)
│   ├── (tabs)/      # Tab screens (Events, Alerts, Tasks, Inventory)
│   └── kds/         # Kitchen Display System
├── web/              # Web ERP (Next.js)
│   └── app/         # Next.js pages
├── server/           # Backend (Express + tRPC)
├── lib/              # Shared libraries
├── supabase/         # Database migrations
└── docs/             # Documentation
```

---

## 🗄️ Database Quick Reference

**Database:** Supabase (PostgreSQL)

**Total Tables:** 15 tables

**Key Tables:**
- `events` - Catering events
- `courses` - Meal courses (Appetizers, Main, etc.)
- `menu_items` - Dishes
- `order_items` - Kitchen orders
- `ingredients` - Inventory items
- `stock_levels` - Current inventory
- `clients` - CRM database
- `staff` - Employee records
- `staff_assignments` - Staff-to-event assignments

**Run Migrations:**
1. Open Supabase SQL Editor
2. Copy content from `supabase/migrations/XXX_*.sql`
3. Run in SQL Editor
4. Enable Realtime on key tables

---

## 🔑 Key Technologies

| Component | Technology |
|-----------|------------|
| Mobile App | Expo + React Native + TypeScript |
| Web ERP | Next.js + React + TypeScript |
| Backend | Express + tRPC + TypeScript |
| Database | Supabase (PostgreSQL) |
| State | React Query + Context API |
| Styling | NativeWind (mobile) + Tailwind (web) |

---

## 📝 Common Commands

```bash
# Development
pnpm dev              # Start all dev servers
pnpm dev:server       # Backend only
pnpm dev:metro        # Mobile app only

# Quality Checks
pnpm check            # TypeScript type checking
pnpm lint             # ESLint
pnpm format           # Prettier formatting
pnpm test             # Run tests

# Build
pnpm build            # Build backend
cd web && pnpm build  # Build web ERP
```

---

## 🎯 Quick Tasks

### Add a New Mobile Screen

1. Create file: `app/new-screen.tsx`
2. Use Expo Router: `import { router } from 'expo-router';`
3. Style with NativeWind (Tailwind classes)

### Add a New Web Page

1. Create directory: `web/app/new-page/page.tsx`
2. Follow Next.js App Router conventions
3. Use existing dashboard layout

### Add a New Database Table

1. Create migration: `supabase/migrations/015_add_table.sql`
2. Run in Supabase SQL Editor
3. Update `docs/database_schema.md`

### Add a New Service Function

**Mobile:** Add to `lib/supabase-kds.ts`
**Web:** Add to `web/lib/supabase-services.ts`

---

## 🔗 Important Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Mobile app root layout |
| `app.config.ts` | Expo configuration |
| `server/routers.ts` | tRPC API routes |
| `lib/trpc.ts` | tRPC client setup |
| `lib/kds-context-realtime.tsx` | KDS real-time context |
| `docs/database_schema.md` | Complete DB documentation |
| `todo.md` | Current task list |

---

## 📚 Documentation

- **`DEVELOPER_GUIDE.md`** - Comprehensive developer reference
- **`docs/database_schema.md`** - Complete database documentation
- **`docs/data_dictionary.md`** - Business terminology reference
- **`SUPABASE_SETUP.md`** - Supabase configuration guide
- **`todo.md`** - Task list with status

---

## 🆘 Getting Help

1. Check `DEVELOPER_GUIDE.md` for detailed information
2. Review existing code patterns
3. Check `docs/` directory for specific guides
4. Review `todo.md` for known tasks

---

## ✅ Current Status

**Completed:**
- Core mobile app screens
- KDS system with real-time sync
- Web ERP with all major pages
- Database schema (15 tables)
- CRUD operations
- Staff scheduling
- Invoice generation

**In Progress:**
- Profile/Settings screen
- Complete invoice testing
- Production RLS policies
- Drag-and-drop staff assignment

---

**For detailed information, see `DEVELOPER_GUIDE.md`**
