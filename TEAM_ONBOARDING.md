# CaterKing Operations Companion - Team Onboarding Guide

**Welcome to the CaterKing team!** This guide will help you get up to speed with the project, understand the architecture, and start contributing effectively.

---

## Table of Contents

1. [Quick Start (30 minutes)](#quick-start)
2. [Environment Setup (1 hour)](#environment-setup)
3. [Architecture Overview (1 hour)](#architecture-overview)
4. [Codebase Walkthrough (2 hours)](#codebase-walkthrough)
5. [Role-Specific Paths](#role-specific-paths)
6. [First Task Guide](#first-task-guide)
7. [Development Workflow](#development-workflow)
8. [Communication & Support](#communication--support)

---

## Quick Start

### What is CaterKing?

CaterKing Operations Companion is a unified catering business management platform with:
- **Mobile App** (React Native/Expo) for on-the-go management
- **Web App** (Next.js) for comprehensive ERP dashboard
- **Shared Database** (Supabase PostgreSQL) for real-time sync
- **Offline Support** with automatic sync when connection restored

### Project Status

- **Overall Progress**: 60% complete (4 of 8 phases)
- **Current Phase**: Phase 5 - UI/UX Polish (just starting)
- **Team Structure**: Flexible, task-based via Linear
- **Tech Stack**: React Native, Next.js, TypeScript, Supabase, Tailwind CSS

### Key Links

| Resource | Link | Purpose |
|----------|------|---------|
| **GitHub Repository** | [caterking_operations_companion](https://github.com) | Code and version control |
| **Linear Project** | [Olde King Catering (OLD)](https://linear.app) | Task management and issue tracking |
| **Supabase Dashboard** | [cuymezsusxmbfzdhcmjp.supabase.co](https://supabase.co) | Database management |
| **Project Documentation** | See links below | Architecture and guides |
| **Slack Channel** | #caterking-dev | Team communication |

### Core Documentation

1. **PROJECT_STATUS_SUMMARY.md** - Current status and progress
2. **INTEGRATION_GUIDE.md** - Cross-platform integration details
3. **OFFLINE_QUEUE_GUIDE.md** - Offline system documentation
4. **server/README.md** - Backend API documentation
5. **This file** - Team onboarding

---

## Environment Setup

### Prerequisites

Before starting, ensure you have:
- **Node.js** 18+ and npm/pnpm
- **Git** for version control
- **VS Code** or preferred code editor
- **GitHub** account with access to repository
- **Supabase** account (provided by team)
- **Linear** account (provided by team)

### Step 1: Clone Repository

```bash
git clone https://github.com/[org]/caterking_operations_companion.git
cd caterking_operations_companion
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install mobile app dependencies
cd app && pnpm install && cd ..

# Install web app dependencies
cd web && pnpm install && cd ..

# Install server dependencies
cd server && pnpm install && cd ..
```

### Step 3: Environment Variables

Create `.env.local` files in each directory:

**Root `.env.local`:**
```bash
# Supabase
SUPABASE_URL=https://cuymezsusxmbfzdhcmjp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_pvhfgIWVS4JOkB3bQau3tw_GhMGfvH2
SUPABASE_SERVICE_ROLE_KEY=sb_secret_BrieEe7Mx-Ufa45NFfdOSw_HobZ1HDH

# Server
API_PORT=3000
NODE_ENV=development
```

**Web `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cuymezsusxmbfzdhcmjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_pvhfgIWVS4JOkB3bQau3tw_GhMGfvH2
```

**Mobile `app.config.ts`:**
- Already configured with Supabase credentials
- Update `appName` if needed

### Step 4: Start Development Servers

**Terminal 1 - Root (runs both mobile and web):**
```bash
pnpm dev
```

**Terminal 2 - Server (optional, if working on backend):**
```bash
cd server
pnpm dev
```

### Step 5: Access Applications

- **Mobile**: Scan QR code in terminal with Expo Go app
- **Web**: http://localhost:3000 (or port shown in terminal)
- **API**: http://localhost:3000/api

### Verification Checklist

- [ ] All dependencies installed without errors
- [ ] Environment variables configured
- [ ] Mobile app loads in Expo Go
- [ ] Web app loads in browser
- [ ] Can see data in Supabase dashboard
- [ ] No TypeScript errors in IDE

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
├──────────────────────┬──────────────────────────────────┤
│   Mobile App         │         Web App                   │
│  (Expo/React Native) │       (Next.js)                   │
│   - 5 Screens        │     - 6 Pages                     │
│   - Offline Support  │     - ERP Dashboard               │
│   - Dark Mode        │     - Real-time Updates           │
└──────────────────────┴──────────────────────────────────┘
           ↓                          ↓
┌─────────────────────────────────────────────────────────┐
│              Shared Integration Layer                    │
├──────────────────────────────────────────────────────────┤
│  - Unified Database Service (supabase-service.ts)        │
│  - Authentication Context (auth-context.tsx)            │
│  - Offline Queue System (offline-queue-service.ts)      │
│  - Sync Manager (offline-sync-manager.ts)               │
│  - React Hooks (use-offline-sync.ts)                    │
└──────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend Layer                           │
├──────────────────────────────────────────────────────────┤
│  - Express.js Server (port 3000)                         │
│  - tRPC API for type-safe communication                  │
│  - Drizzle ORM for database access                       │
└──────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│              Database Layer                              │
├──────────────────────────────────────────────────────────┤
│  - Supabase PostgreSQL                                   │
│  - 11 Core Tables                                        │
│  - 16 Migrations                                         │
│  - Real-time Subscriptions                               │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

**Online Scenario:**
1. User performs action in mobile/web app
2. Action sent to Supabase via shared database service
3. Supabase updates database
4. Real-time subscription triggers
5. All connected clients receive update
6. UI refreshes automatically

**Offline Scenario:**
1. User performs action while offline
2. Action queued in AsyncStorage (mobile) or LocalStorage (web)
3. UI updates optimistically
4. When connection restored, sync manager detects it
5. Queued operations sent to Supabase in priority order
6. Conflicts detected and resolved (last-write-wins)
7. UI synced with server state

### Core Concepts

**Entities** - Business objects (clients, staff, events, invoices)  
**Operations** - CRUD actions on entities  
**Queue** - Offline persistence of operations  
**Sync** - Sending queued operations to server  
**Subscription** - Real-time updates from Supabase  
**Conflict** - When same entity edited offline and online

---

## Codebase Walkthrough

### Project Structure

```
caterking_operations_companion/
│
├── app/                              # Mobile App (Expo/React Native)
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Tab bar configuration
│   │   ├── index.tsx                # Home screen
│   │   ├── events.tsx               # Events screen
│   │   ├── staff.tsx                # Staff screen
│   │   ├── clients.tsx              # Clients screen
│   │   └── inventory.tsx            # Inventory screen
│   ├── components/
│   │   ├── screen-container.tsx     # SafeArea wrapper
│   │   ├── themed-view.tsx          # Theme-aware view
│   │   └── ui/                      # UI components
│   ├── hooks/
│   │   ├── use-colors.ts            # Theme colors
│   │   ├── use-color-scheme.ts      # Dark/light mode
│   │   └── use-auth.ts              # Authentication
│   ├── lib/
│   │   ├── supabase-client.ts       # Supabase setup
│   │   ├── kds-context.tsx          # KDS state management
│   │   └── utils.ts                 # Utilities
│   ├── assets/
│   │   └── images/                  # App icons and splash
│   ├── app.config.ts                # Expo configuration
│   ├── tailwind.config.js           # Tailwind config
│   ├── theme.config.js              # Color tokens
│   └── package.json
│
├── web/                              # Web App (Next.js)
│   ├── pages/
│   │   ├── index.tsx                # Dashboard
│   │   ├── events.tsx               # Events page
│   │   ├── staff.tsx                # Staff page
│   │   ├── clients.tsx              # Clients page
│   │   ├── invoices.tsx             # Invoices page
│   │   ├── menus.tsx                # Menu items page
│   │   └── api/                     # API routes
│   ├── components/
│   │   ├── client-form.tsx          # Client form
│   │   ├── event-form.tsx           # Event form
│   │   ├── staff-form.tsx           # Staff form
│   │   ├── menu-item-form.tsx       # Menu form
│   │   └── invoice-generator.tsx    # Invoice generator
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── supabase-services.ts     # Database operations
│   │   └── utils.ts                 # Utilities
│   ├── __tests__/
│   │   ├── edit-functionality.test.ts
│   │   ├── conflict-detection.test.ts
│   │   ├── invoice-generation.test.ts
│   │   ├── recurring-templates.test.ts
│   │   ├── scheduling.test.ts
│   │   ├── cross-platform-integration.test.ts
│   │   ├── offline-queue.test.ts
│   │   ├── e2e-workflows.test.ts
│   │   └── setup.ts
│   ├── styles/
│   │   └── globals.css
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── shared/                           # Cross-Platform Code
│   ├── database-types.ts            # Unified TypeScript types
│   ├── supabase-service.ts          # Core database operations
│   ├── auth-context.tsx             # Authentication context
│   ├── offline-queue-types.ts       # Offline queue types
│   ├── offline-queue-service.ts     # Offline persistence
│   ├── offline-sync-manager.ts      # Sync orchestration
│   ├── offline-database-wrapper.ts  # Offline-aware operations
│   └── use-offline-sync.ts          # React hooks
│
├── server/                           # Backend (Express)
│   ├── _core/
│   │   ├── index.ts                 # Server entry point
│   │   ├── db.ts                    # Database setup
│   │   └── routes/                  # API routes
│   ├── README.md                    # Backend documentation
│   └── package.json
│
├── migrations/                       # Database Migrations
│   ├── 001_initial_schema.sql
│   ├── 002_add_events_table.sql
│   └── ... (16 total)
│
├── INTEGRATION_GUIDE.md             # Cross-platform integration
├── OFFLINE_QUEUE_GUIDE.md           # Offline system docs
├── PROJECT_STATUS_SUMMARY.md        # Project status
├── TEAM_ONBOARDING.md               # This file
└── package.json
```

### Key Files to Understand

**For All Developers:**
1. `shared/database-types.ts` - Understand all entity types
2. `shared/supabase-service.ts` - Learn CRUD operations
3. `PROJECT_STATUS_SUMMARY.md` - Project overview

**For Mobile Developers:**
1. `app/(tabs)/index.tsx` - Home screen example
2. `app/lib/kds-context.tsx` - State management
3. `app/app.config.ts` - App configuration

**For Web Developers:**
1. `web/pages/index.tsx` - Dashboard example
2. `web/lib/supabase-services.ts` - Database operations
3. `web/components/event-form.tsx` - Form example

**For Backend Developers:**
1. `server/README.md` - Backend documentation
2. `server/_core/index.ts` - Server setup
3. `migrations/` - Database schema

**For DevOps/QA:**
1. `web/__tests__/` - Test examples
2. `INTEGRATION_GUIDE.md` - Integration details
3. `vitest.config.ts` - Test configuration

---

## Role-Specific Paths

### Frontend Developer (Mobile)

**Onboarding Timeline**: 2-3 days

**Day 1: Setup & Understanding**
- [ ] Complete environment setup
- [ ] Run mobile app in Expo Go
- [ ] Read `app/(tabs)/index.tsx`
- [ ] Understand NativeWind (Tailwind for React Native)
- [ ] Review `app/lib/kds-context.tsx` for state management

**Day 2: Architecture Deep Dive**
- [ ] Read `INTEGRATION_GUIDE.md`
- [ ] Study `shared/supabase-service.ts`
- [ ] Understand `shared/offline-queue-service.ts`
- [ ] Review `shared/use-offline-sync.ts` hooks

**Day 3: First Task**
- [ ] Pick task from Phase 5 (UI/UX Polish)
- [ ] Start with OLD-82 (Offline Indicator Component)
- [ ] Use `useSyncStatus()` hook
- [ ] Create component in `app/components/`

**Key Resources:**
- Expo Documentation: https://docs.expo.dev
- React Native Docs: https://reactnative.dev/docs
- NativeWind: https://www.nativewind.dev
- Tailwind CSS: https://tailwindcss.com/docs

**First Tasks (Recommended Order):**
1. OLD-82: Offline Indicator Component
2. OLD-84: Loading States & Error Handling
3. OLD-85: Mobile App Branding
4. OLD-87: Accessibility Improvements

---

### Frontend Developer (Web)

**Onboarding Timeline**: 2-3 days

**Day 1: Setup & Understanding**
- [ ] Complete environment setup
- [ ] Run web app at http://localhost:3000
- [ ] Read `web/pages/index.tsx`
- [ ] Understand Next.js and Tailwind CSS
- [ ] Review `web/components/event-form.tsx` for form patterns

**Day 2: Architecture Deep Dive**
- [ ] Read `INTEGRATION_GUIDE.md`
- [ ] Study `web/lib/supabase-services.ts`
- [ ] Understand real-time subscriptions
- [ ] Review existing pages structure

**Day 3: First Task**
- [ ] Pick task from Phase 5 (UI/UX Polish)
- [ ] Start with OLD-86 (Web Dashboard Redesign)
- [ ] Improve layout and add visualizations
- [ ] Add loading states to existing pages

**Key Resources:**
- Next.js Documentation: https://nextjs.org/docs
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- Supabase Realtime: https://supabase.com/docs/guides/realtime

**First Tasks (Recommended Order):**
1. OLD-86: Web Dashboard Redesign
2. OLD-84: Loading States & Error Handling
3. OLD-87: Accessibility Improvements
4. OLD-88: Performance Optimization

---

### Backend Developer

**Onboarding Timeline**: 2-3 days

**Day 1: Setup & Understanding**
- [ ] Complete environment setup
- [ ] Read `server/README.md`
- [ ] Understand Express.js and tRPC setup
- [ ] Review `server/_core/index.ts`
- [ ] Understand Drizzle ORM

**Day 2: Database & API Deep Dive**
- [ ] Study database schema in `migrations/`
- [ ] Read `shared/database-types.ts`
- [ ] Understand `shared/supabase-service.ts`
- [ ] Review API endpoints in `server/_core/routes/`

**Day 3: First Task**
- [ ] Pick task from Phase 6 (Advanced Features)
- [ ] Start with OLD-90 (Push Notifications)
- [ ] Implement server-side notification logic
- [ ] Create API endpoint for notifications

**Key Resources:**
- Express.js: https://expressjs.com
- tRPC: https://trpc.io/docs
- Drizzle ORM: https://orm.drizzle.team
- Supabase: https://supabase.com/docs

**First Tasks (Recommended Order):**
1. OLD-90: Push Notifications (server-side)
2. OLD-91: Email Notifications (server-side)
3. OLD-93: Report Generation (server-side)
4. OLD-94: Analytics Dashboard (server-side)

---

### QA/Testing Engineer

**Onboarding Timeline**: 1-2 days

**Day 1: Setup & Test Understanding**
- [ ] Complete environment setup
- [ ] Run existing tests: `pnpm test`
- [ ] Review `web/__tests__/` directory
- [ ] Understand Vitest configuration
- [ ] Study test patterns in existing tests

**Day 2: Test Strategy**
- [ ] Read `INTEGRATION_GUIDE.md`
- [ ] Understand offline queue testing
- [ ] Review test data setup in `web/__tests__/setup.ts`
- [ ] Plan tests for Phase 5 features

**Key Resources:**
- Vitest: https://vitest.dev
- Testing Library: https://testing-library.com
- Jest: https://jestjs.io (similar patterns)

**First Tasks:**
1. Create tests for Phase 5 features as they're implemented
2. Run integration tests with Supabase
3. Validate offline queue functionality
4. Test cross-platform sync scenarios

---

### DevOps/Infrastructure Engineer

**Onboarding Timeline**: 1-2 days

**Day 1: Setup & Infrastructure Understanding**
- [ ] Complete environment setup
- [ ] Review `server/README.md`
- [ ] Understand current deployment setup
- [ ] Review GitHub Actions configuration (if exists)

**Day 2: DevOps Planning**
- [ ] Plan CI/CD pipeline (Phase 8)
- [ ] Design staging environment
- [ ] Plan monitoring and alerting
- [ ] Review database backup strategy

**Key Resources:**
- GitHub Actions: https://docs.github.com/en/actions
- Docker: https://docs.docker.com
- Supabase Deployment: https://supabase.com/docs/guides/hosting/overview

**First Tasks (Phase 8):**
1. Set up GitHub Actions CI/CD pipeline
2. Create staging environment
3. Implement monitoring and alerting
4. Set up automated backups

---

## First Task Guide

### How to Pick Your First Task

1. **Go to Linear**: https://linear.app
2. **Navigate to**: Olde King Catering (OLD) team
3. **Filter by**: Phase 5 (UI/UX Polish) issues
4. **Look for**: Issues labeled "good first issue" or "help wanted"
5. **Check**: Issue description and acceptance criteria

### Recommended First Tasks by Role

| Role | First Task | Issue ID | Difficulty |
|------|-----------|----------|-----------|
| Mobile Dev | Offline Indicator Component | OLD-82 | Easy |
| Web Dev | Web Dashboard Redesign | OLD-86 | Medium |
| Backend Dev | Push Notifications | OLD-90 | Medium |
| QA/Testing | Create tests for Phase 5 | - | Easy |
| DevOps | Set up CI/CD pipeline | Phase 8 | Hard |

### Task Workflow

**Step 1: Understand the Task**
```
1. Read the Linear issue description
2. Review acceptance criteria
3. Check linked documentation
4. Ask questions in comments if unclear
```

**Step 2: Create Feature Branch**
```bash
git checkout main
git pull origin main
git checkout -b feature/OLD-XX-short-description
```

**Step 3: Implement the Feature**
```
1. Write code following project conventions
2. Add tests for new functionality
3. Update documentation if needed
4. Ensure no TypeScript errors
```

**Step 4: Test Locally**
```bash
# Run tests
pnpm test

# Run type check
pnpm check

# Test in app/browser
# Mobile: Scan QR code
# Web: http://localhost:3000
```

**Step 5: Create Pull Request**
```bash
git add .
git commit -m "feat(OLD-XX): short description"
git push origin feature/OLD-XX-short-description
```

**Step 6: Link to Linear**
- Go to Linear issue
- Paste PR link in comments
- Update status to "In Review"

**Step 7: Address Review Feedback**
- Make requested changes
- Push to same branch
- Reply to comments

**Step 8: Merge**
- Get approval from reviewer
- Merge to main
- Update Linear issue to "Done"

### Example: Implementing Offline Indicator Component

**Task**: OLD-82 - Offline Indicator Component

**Acceptance Criteria:**
- [ ] Component shows online/offline status in header
- [ ] Displays pending sync count
- [ ] Shows last sync time
- [ ] Uses `useSyncStatus()` hook
- [ ] Works on both mobile and web
- [ ] Has loading animation

**Implementation Steps:**

1. **Create Component** (`app/components/offline-indicator.tsx`):
```tsx
import { useOfflineSync } from '@/shared/use-offline-sync';
import { Text, View } from 'react-native';

export function OfflineIndicator() {
  const { isOnline, pendingCount, lastSync } = useOfflineSync();
  
  return (
    <View className="flex-row items-center gap-2 px-4 py-2">
      <View className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500" : "bg-red-500"
      )} />
      <Text className="text-sm text-muted">
        {isOnline ? 'Online' : 'Offline'}
        {pendingCount > 0 && ` (${pendingCount} pending)`}
      </Text>
    </View>
  );
}
```

2. **Add to Header** (`app/(tabs)/_layout.tsx`):
```tsx
import { OfflineIndicator } from '@/components/offline-indicator';

// In Tabs.Screen options:
headerRight: () => <OfflineIndicator />,
```

3. **Write Tests** (`web/__tests__/offline-indicator.test.ts`):
```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { OfflineIndicator } from '@/app/components/offline-indicator';

describe('OfflineIndicator', () => {
  it('shows online status when connected', () => {
    // Test implementation
  });
  
  it('shows offline status when disconnected', () => {
    // Test implementation
  });
});
```

4. **Create PR** with description linking to OLD-82

5. **Request Review** from team lead

---

## Development Workflow

### Git Workflow

**Branch Naming Convention:**
```
feature/OLD-XX-short-description    # New features
bugfix/OLD-XX-short-description     # Bug fixes
chore/OLD-XX-short-description      # Maintenance
```

**Commit Message Format:**
```
feat(OLD-XX): short description

Longer description if needed.
Fixes #OLD-XX
```

**Pull Request Process:**
1. Create PR with clear title and description
2. Link to Linear issue
3. Request review from team lead
4. Address feedback
5. Merge when approved

### Code Quality Standards

**TypeScript:**
- No `any` types without justification
- All functions typed
- Strict mode enabled

**Testing:**
- New features include tests
- Minimum 80% coverage
- All tests passing

**Formatting:**
- Run `pnpm format` before committing
- Use Prettier configuration
- Follow ESLint rules

**Documentation:**
- Update README if needed
- Add comments for complex logic
- Document API changes

### Review Process

**Reviewer Responsibilities:**
- Check code quality and style
- Verify tests are included
- Ensure no TypeScript errors
- Test locally if possible
- Provide constructive feedback

**Author Responsibilities:**
- Respond to all comments
- Make requested changes
- Re-request review when ready
- Merge when approved

---

## Communication & Support

### Team Channels

| Channel | Purpose | When to Use |
|---------|---------|------------|
| **#caterking-dev** | General development | Questions, updates, blockers |
| **#caterking-design** | Design discussions | UI/UX feedback |
| **#caterking-devops** | Infrastructure | Deployment, monitoring |
| **Linear Comments** | Task-specific | Technical details, progress |
| **GitHub Issues** | Bugs and features | Bug reports, feature requests |

### Getting Help

**For Technical Questions:**
1. Check project documentation
2. Search Linear for similar issues
3. Ask in #caterking-dev Slack
4. Comment on Linear issue
5. Schedule pair programming session

**For Blocked Tasks:**
1. Comment on Linear issue with details
2. Tag team lead or relevant expert
3. Post in #caterking-dev
4. Schedule sync meeting if needed

**For Environment Issues:**
1. Check environment setup guide (above)
2. Verify .env files
3. Clear node_modules and reinstall
4. Ask in #caterking-dev

### Useful Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test offline-queue.test.ts

# Type check
pnpm check

# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build

# Start development servers
pnpm dev

# Check git status
git status

# View recent commits
git log --oneline -10
```

### Documentation Links

**Internal Documentation:**
- [PROJECT_STATUS_SUMMARY.md](./PROJECT_STATUS_SUMMARY.md) - Project overview
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Cross-platform integration
- [OFFLINE_QUEUE_GUIDE.md](./OFFLINE_QUEUE_GUIDE.md) - Offline system
- [server/README.md](./server/README.md) - Backend API

**External Documentation:**
- [Supabase Docs](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Docs](https://reactnative.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Checklist for First Week

### Day 1
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Set up environment variables
- [ ] Start development servers
- [ ] Access mobile and web apps
- [ ] Verify no errors

### Day 2
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read INTEGRATION_GUIDE.md
- [ ] Understand project architecture
- [ ] Review shared code (database-types.ts, supabase-service.ts)
- [ ] Understand your role's specific code

### Day 3
- [ ] Read relevant documentation for your role
- [ ] Review existing tests
- [ ] Understand Linear workflow
- [ ] Pick first task from Phase 5
- [ ] Ask clarifying questions

### Day 4-5
- [ ] Implement first task
- [ ] Write tests
- [ ] Create pull request
- [ ] Address review feedback
- [ ] Merge to main

### End of Week
- [ ] First PR merged
- [ ] Comfortable with codebase
- [ ] Understand development workflow
- [ ] Ready for second task

---

## Success Criteria

You'll know you're onboarded when you can:

1. **Environment**: Run all apps locally without errors
2. **Architecture**: Explain how mobile, web, and database communicate
3. **Code**: Navigate codebase and find relevant files
4. **Workflow**: Create branch, implement feature, submit PR
5. **Testing**: Write tests for your code
6. **Communication**: Ask questions and contribute to discussions
7. **Tasks**: Pick and complete Linear issues independently

---

## Next Steps

1. **Complete Environment Setup** - Follow the setup guide above
2. **Read Documentation** - Start with PROJECT_STATUS_SUMMARY.md
3. **Pick First Task** - Choose from Phase 5 (UI/UX Polish)
4. **Ask Questions** - Post in #caterking-dev or comment on Linear
5. **Submit PR** - Follow the workflow guide

---

## Frequently Asked Questions

**Q: How do I run the mobile app?**  
A: Run `pnpm dev` in root, scan QR code with Expo Go app on phone.

**Q: Where are the database credentials?**  
A: In `.env.local` files (already provided by team lead).

**Q: How do I run tests?**  
A: Run `pnpm test` in root or specific directory.

**Q: What if I get TypeScript errors?**  
A: Run `pnpm check` to see all errors, fix them before submitting PR.

**Q: How do I know if my code is working?**  
A: Test locally in app/browser, run tests, verify no errors.

**Q: Who do I ask if I'm stuck?**  
A: Post in #caterking-dev or comment on Linear issue.

**Q: How long should first task take?**  
A: 1-2 days for experienced developers, 2-3 days for learning.

**Q: Can I work on multiple tasks?**  
A: Start with one, complete it, then pick next task.

---

## Welcome to the Team!

We're excited to have you on board. Don't hesitate to ask questions—everyone started where you are. Focus on completing your first task well, and you'll be contributing effectively in no time.

**Let's build something great together!** 🚀

---

*Last Updated: January 31, 2026*  
*For questions or updates, contact the team lead or post in #caterking-dev*
