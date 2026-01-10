# CaterKing Operations Companion - Project Rules

**Last Updated:** January 2026  
**Status:** Active Standards  
**Purpose:** Mandatory rules and standards for all code contributions

---

## Table of Contents

1. [Code Style & Formatting](#code-style--formatting)
2. [Naming Conventions](#naming-conventions)
3. [File Organization](#file-organization)
4. [Git Workflow](#git-workflow)
5. [Database Rules](#database-rules)
6. [API & Services](#api--services)
7. [State Management](#state-management)
8. [Real-time & Subscriptions](#real-time--subscriptions)
9. [Error Handling](#error-handling)
10. [Testing Requirements](#testing-requirements)
11. [Documentation Requirements](#documentation-requirements)
12. [Security Rules](#security-rules)
13. [Performance Guidelines](#performance-guidelines)
14. [Code Review Standards](#code-review-standards)

---

## Code Style & Formatting

### TypeScript

**Rules:**
- ✅ **Strict Mode:** Always enabled - no `any` types allowed
- ✅ **Type Everything:** All functions, variables, and parameters must have explicit types
- ✅ **Use Interfaces:** Prefer `interface` over `type` for object shapes
- ✅ **Export Types:** Export types and interfaces alongside code

**Example:**
```typescript
// ✅ GOOD
interface EventData {
  id: string;
  name: string;
  guest_count: number;
}

function getEvent(id: string): Promise<EventData | null> {
  // implementation
}

// ❌ BAD
function getEvent(id: any): any {
  // implementation
}
```

### React/React Native

**Rules:**
- ✅ **Functional Components:** Always use functional components with hooks
- ✅ **Hooks Order:** Follow rules of hooks - hooks must be called in same order
- ✅ **Memoization:** Use `useMemo` and `useCallback` for expensive computations
- ✅ **Props Destructuring:** Destructure props at function signature

**Example:**
```typescript
// ✅ GOOD
function EventCard({ event, onPress }: EventCardProps) {
  const formattedDate = useMemo(() => formatDate(event.event_date), [event.event_date]);
  
  const handlePress = useCallback(() => {
    onPress(event.id);
  }, [event.id, onPress]);
  
  return <Pressable onPress={handlePress}>...</Pressable>;
}

// ❌ BAD
function EventCard(props: any) {
  // No memoization, no proper types
}
```

### Import Organization

**Rules:**
1. External libraries (React, Expo, etc.)
2. Internal libraries (`@/lib`, `@/components`)
3. Shared types (`@shared/types`)
4. Relative imports (`./component`)
5. Types-only imports last (`import type { ... }`)

**Example:**
```typescript
// ✅ GOOD
import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

import type { Event } from '@/shared/types';
```

### Formatting

**Tools:**
- **Prettier:** Auto-format on save (configured in `.prettierrc`)
- **ESLint:** Lint on save (configured in `eslint.config.js`)

**Rules:**
- ✅ **Trailing Commas:** Always use trailing commas in multi-line objects/arrays
- ✅ **Semicolons:** Always use semicolons
- ✅ **Quotes:** Single quotes for strings, double quotes for JSX attributes
- ✅ **Line Length:** Max 100 characters (soft limit)

**Run Formatting:**
```bash
pnpm format  # Format all files
pnpm lint    # Check for linting errors
```

---

## Naming Conventions

### Database & Forms

**Format:** `snake_case` for all database columns and form fields

**Rules:**
- ✅ **Database columns:** `snake_case` (e.g., `guest_count`, `event_date`)
- ✅ **Form fields:** Must exactly match database column names
- ✅ **Foreign keys:** `{table}_id` (e.g., `event_id`, `client_id`)
- ✅ **Timestamps:** `{action}_at` (e.g., `created_at`, `updated_at`, `fired_at`)
- ✅ **Booleans:** `is_{property}` or `has_{property}` (e.g., `is_available`)

**Example:**
```sql
-- ✅ GOOD
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_date DATE,
  guest_count INTEGER,
  client_id UUID REFERENCES clients(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript/JavaScript

**Format:** `camelCase` for variables and functions, `PascalCase` for components/types

**Rules:**
- ✅ **Variables:** `camelCase` (e.g., `guestCount`, `eventDate`)
- ✅ **Functions:** `camelCase` with verb prefix (e.g., `getEvents`, `createEvent`)
- ✅ **Components:** `PascalCase` (e.g., `EventForm`, `ClientList`)
- ✅ **Types/Interfaces:** `PascalCase` with suffix (e.g., `EventData`, `EventFormProps`)
- ✅ **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `MAX_GUEST_COUNT`, `API_BASE_URL`)

**Example:**
```typescript
// ✅ GOOD
const MAX_GUEST_COUNT = 500;
const guestCount = event.guest_count;

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventData) => void;
}

function EventForm({ event, onSubmit }: EventFormProps) {
  const handleSubmit = async (formData: FormData) => {
    await onSubmit(formData);
  };
}
```

### Files

**Rules:**
- ✅ **Components:** `kebab-case.tsx` (e.g., `event-form.tsx`, `client-list.tsx`)
- ✅ **Utilities:** `kebab-case.ts` (e.g., `supabase-services.ts`, `date-utils.ts`)
- ✅ **Migrations:** `{number}_{description}.sql` (e.g., `015_add_invoices.sql`)

**Example:**
```
components/
  event-form.tsx      ✅ GOOD
  client-list.tsx     ✅ GOOD
  EventForm.tsx       ❌ BAD (PascalCase)
  eventForm.tsx       ❌ BAD (camelCase)
```

**See:** `docs/naming_conventions.md` for complete naming standards

---

## File Organization

### Directory Structure Rules

**Mobile App (`app/`):**
- ✅ Use Expo Router file-based routing
- ✅ Group related screens in directories
- ✅ Use `(tabs)` for tab navigation
- ✅ Use `_layout.tsx` for layout wrappers

**Web ERP (`web/app/`):**
- ✅ Use Next.js App Router conventions
- ✅ One page per directory with `page.tsx`
- ✅ Use route groups for organization

**Components:**
- ✅ Shared components in root `components/`
- ✅ Web-specific components in `web/components/`
- ✅ Group related components in subdirectories

**Services:**
- ✅ Mobile services in `lib/` (e.g., `supabase-kds.ts`)
- ✅ Web services in `web/lib/` (e.g., `supabase-services.ts`)
- ✅ Shared utilities in `shared/`

### File Naming Rules

**Rules:**
- ✅ One component per file
- ✅ File name must match component name (converted to kebab-case)
- ✅ Use descriptive names, not abbreviations
- ✅ Index files only for barrel exports

**Example:**
```typescript
// ✅ GOOD: event-form.tsx
export function EventForm() { }

// ❌ BAD: form.tsx, ef.tsx, Event.tsx
```

---

## Git Workflow

### Branch Naming

**Format:** `{type}/{description}`

**Types:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

**Examples:**
```
feature/invoice-generation
fix/staff-conflict-detection
refactor/kds-context-optimization
docs/update-developer-guide
```

### Commit Messages

**Format:** `{type}: {description}`

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Build/tooling changes
- `style:` - Formatting (no code change)

**Examples:**
```
feat: add invoice generation functionality
fix: resolve staff conflict detection error
refactor: optimize KDS real-time subscriptions
docs: update database schema documentation
test: add unit tests for inventory service
```

**Rules:**
- ✅ Use imperative mood ("add" not "added")
- ✅ Keep first line under 50 characters
- ✅ Add detailed description in body if needed
- ✅ Reference issues with `#issue-number`

### Pull Request Process

**Rules:**
1. ✅ **Create feature branch** from `main`
2. ✅ **Make changes** following all project rules
3. ✅ **Run quality checks:** `pnpm check && pnpm lint && pnpm test`
4. ✅ **Update documentation** if needed
5. ✅ **Create PR** with clear description
6. ✅ **Request review** from at least one team member
7. ✅ **Address feedback** before merging
8. ✅ **Squash merge** into `main`

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Added new tests if needed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No linting errors
- [ ] No type errors
```

---

## Database Rules

### Schema Changes

**Rules:**
1. ✅ **Always create migration file** in `supabase/migrations/`
2. ✅ **Migration naming:** `{number}_{description}.sql`
3. ✅ **Use IF NOT EXISTS** for all CREATE statements
4. ✅ **Include rollback** if destructive changes
5. ✅ **Update documentation** in `docs/database_schema.md`
6. ✅ **Test migrations** on copy of production data first

**Migration Template:**
```sql
-- Migration {number}: {Description}
-- Purpose: {Why this change is needed}
-- Date: {YYYY-MM-DD}

-- Add new table/column
CREATE TABLE IF NOT EXISTS table_name (
  -- schema
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

### Column Naming

**Rules:**
- ✅ Use `snake_case` for all columns
- ✅ Primary key: always named `id` (UUID type)
- ✅ Foreign key: `{table}_id` (UUID type)
- ✅ Timestamps: `{action}_at` (TIMESTAMPTZ type)
- ✅ Booleans: `is_{property}` prefix
- ✅ Include units in numeric field names (`prep_time_minutes`)

**See:** `docs/naming_conventions.md` for complete database naming rules

### Indexes

**Rules:**
- ✅ **Index all foreign keys** for join performance
- ✅ **Index frequently queried columns** (status, dates)
- ✅ **Index columns in WHERE clauses** used frequently
- ✅ **Composite indexes** for multi-column queries
- ✅ **Naming:** `idx_{table}_{column}`

**Example:**
```sql
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_order_items_station_status 
  ON order_items(station, status);
```

### Row Level Security (RLS)

**Rules:**
- ✅ **Enable RLS** on all tables
- ✅ **Development:** Use permissive policies (`USING (true)`)
- ✅ **Production:** Create restrictive policies based on user roles
- ✅ **Document policies** in migration comments

**Development Policy:**
```sql
CREATE POLICY "Enable all access for events" 
  ON events FOR ALL 
  USING (true);
```

**Production Policy (Example):**
```sql
CREATE POLICY "Authenticated users can view events" 
  ON events FOR SELECT 
  USING (auth.role() = 'authenticated');
```

---

## API & Services

### tRPC Procedures

**Rules:**
1. ✅ **Use typed procedures:** `publicProcedure` or `protectedProcedure`
2. ✅ **Validate inputs:** Use Zod schemas for all inputs
3. ✅ **Handle errors:** Return proper error responses
4. ✅ **Type outputs:** Explicit return types

**Example:**
```typescript
// ✅ GOOD
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';

const createEventSchema = z.object({
  event_name: z.string().min(1),
  event_date: z.string().date(),
  guest_count: z.number().int().positive(),
});

export const eventsRouter = router({
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const event = await createEvent(input);
      return event;
    }),
});
```

### Supabase Services

**Rules:**
1. ✅ **Service layer:** Create service functions in `lib/` or `web/lib/`
2. ✅ **Error handling:** Handle Supabase errors gracefully
3. ✅ **Type safety:** Export TypeScript interfaces for data types
4. ✅ **Mock mode:** Support mock data when Supabase not configured

**Example:**
```typescript
// ✅ GOOD
export interface Event {
  id: string;
  event_name: string;
  event_date: string;
  guest_count: number;
}

export async function getEvents(): Promise<Event[]> {
  if (useMockData()) {
    return mockEvents;
  }
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  
  return data || [];
}
```

### API Endpoints

**Rules:**
- ✅ **All API routes** must start with `/api/` for gateway routing
- ✅ **RESTful conventions** for HTTP routes
- ✅ **Use tRPC** for type-safe RPC calls (preferred)
- ✅ **Error responses** must follow consistent format

---

## State Management

### Server State (React Query)

**Rules:**
1. ✅ **Use React Query** for all server state (mobile app)
2. ✅ **Query keys:** Use descriptive, hierarchical keys
3. ✅ **Cache invalidation:** Invalidate related queries on mutations
4. ✅ **Error handling:** Handle errors in query/mutation callbacks

**Example:**
```typescript
// ✅ GOOD
const { data: events, isLoading, error } = trpc.events.list.useQuery();

const createMutation = trpc.events.create.useMutation({
  onSuccess: () => {
    utils.events.list.invalidate();
  },
  onError: (error) => {
    console.error('Failed to create event:', error);
  },
});
```

### Client State (Context API)

**Rules:**
1. ✅ **Use Context API** for truly global state (KDS context, theme)
2. ✅ **Local state** for component-specific state (useState)
3. ✅ **Avoid prop drilling:** Use context for deeply nested props
4. ✅ **Memoize context values** to prevent unnecessary re-renders

**Example:**
```typescript
// ✅ GOOD
const KDSContext = createContext<KDSContextType | null>(null);

export function KDSProvider({ children }: { children: ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  
  const value = useMemo(() => ({
    currentEvent,
    setCurrentEvent,
    // other values
  }), [currentEvent]);
  
  return (
    <KDSContext.Provider value={value}>
      {children}
    </KDSContext.Provider>
  );
}
```

### Local Storage (AsyncStorage)

**Rules:**
1. ✅ **Use AsyncStorage** for offline persistence (mobile app)
2. ✅ **Sync with server** when online
3. ✅ **Handle migration** if schema changes
4. ✅ **Prefix keys** to avoid conflicts

**Example:**
```typescript
// ✅ GOOD
const STORAGE_KEY = '@caterking:events';

async function saveEvents(events: Event[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events:', error);
  }
}
```

---

## Real-time & Subscriptions

### Supabase Realtime

**Rules:**
1. ✅ **Subscribe to updates** in context or component
2. ✅ **Clean up subscriptions** on unmount
3. ✅ **Handle connection errors** gracefully
4. ✅ **Update local state** on changes

**Example:**
```typescript
// ✅ GOOD
useEffect(() => {
  const channel = supabase
    .channel('events-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setEvents(prev => [...prev, payload.new as Event]);
        } else if (payload.eventType === 'UPDATE') {
          setEvents(prev => 
            prev.map(e => e.id === payload.new.id ? payload.new as Event : e)
          );
        } else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Real-time Context (KDS)

**Rules:**
1. ✅ **Use KDSRealtimeProvider** for KDS real-time state
2. ✅ **Subscribe once** at provider level
3. ✅ **Update state** based on real-time events
4. ✅ **Handle offline** with local state fallback

**See:** `lib/kds-context-realtime.tsx` for implementation reference

---

## Error Handling

### General Rules

**Rules:**
1. ✅ **Always handle errors** - never silently fail
2. ✅ **Log errors** with context for debugging
3. ✅ **Show user-friendly messages** to users
4. ✅ **Use try/catch** for async operations
5. ✅ **Validate inputs** before processing

**Example:**
```typescript
// ✅ GOOD
async function createEvent(data: EventData) {
  try {
    // Validate input
    if (!data.event_name) {
      throw new Error('Event name is required');
    }
    
    const result = await supabase
      .from('events')
      .insert([data])
      .select()
      .single();
    
    if (result.error) {
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to create event:', error);
    throw error; // Re-throw for caller to handle
  }
}
```

### Error Display

**Rules:**
1. ✅ **User-facing errors:** Clear, actionable messages
2. ✅ **Developer errors:** Log full error details to console
3. ✅ **Error boundaries:** Use React error boundaries for component errors
4. ✅ **Network errors:** Handle offline/connection issues gracefully

**Example:**
```typescript
// ✅ GOOD
function EventForm() {
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: EventData) => {
    try {
      await createEvent(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : 'Failed to create event. Please try again.';
      setError(message);
    }
  };
  
  return (
    <>
      {error && <Text className="text-red-500">{error}</Text>}
      {/* form */}
    </>
  );
}
```

---

## Testing Requirements

### Test Coverage

**Rules:**
1. ✅ **Unit tests** for all service functions
2. ✅ **Integration tests** for critical flows
3. ✅ **Test files** in `tests/` or `__tests__/` directories
4. ✅ **Test naming:** `{file}.test.ts` or `{feature}.test.ts`

### Test Structure

**Example:**
```typescript
// ✅ GOOD
import { describe, expect, it } from 'vitest';
import { createEvent, getEvents } from '../lib/event-service';

describe('Event Service', () => {
  describe('createEvent', () => {
    it('should create an event with valid data', async () => {
      const eventData = {
        event_name: 'Test Event',
        event_date: '2026-02-14',
        guest_count: 100,
      };
      
      const event = await createEvent(eventData);
      
      expect(event).toBeDefined();
      expect(event.event_name).toBe(eventData.event_name);
    });
    
    it('should throw error for invalid data', async () => {
      await expect(createEvent({} as EventData)).rejects.toThrow();
    });
  });
});
```

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test --watch      # Watch mode
pnpm test event        # Run specific test file
```

---

## Documentation Requirements

### Code Documentation

**Rules:**
1. ✅ **JSDoc comments** for all exported functions
2. ✅ **Inline comments** for complex logic
3. ✅ **Type annotations** instead of comments where possible
4. ✅ **README files** for major features/modules

**Example:**
```typescript
// ✅ GOOD
/**
 * Creates a new event in the database.
 * 
 * @param data - Event data to create
 * @returns Created event or null if creation failed
 * @throws Error if validation fails or database operation fails
 */
export async function createEvent(data: EventData): Promise<Event | null> {
  // Implementation
}
```

### Documentation Files

**Required Documentation:**
- ✅ **README.md** - Project overview and setup
- ✅ **DEVELOPER_GUIDE.md** - Comprehensive developer reference
- ✅ **PROJECT_RULES.md** - This file (project rules)
- ✅ **docs/database_schema.md** - Database documentation
- ✅ **docs/naming_conventions.md** - Naming standards

**Update Documentation When:**
- Adding new features
- Changing architecture
- Updating database schema
- Modifying API contracts
- Adding new dependencies

---

## Security Rules

### Authentication

**Rules:**
1. ✅ **Use Manus OAuth** for user authentication
2. ✅ **Protected routes** require authentication
3. ✅ **Token storage:** SecureStore (mobile) or HTTP-only cookies (web)
4. ✅ **Validate tokens** on all protected endpoints

### Database Security

**Rules:**
1. ✅ **RLS enabled** on all tables
2. ✅ **Development:** Permissive policies allowed
3. ✅ **Production:** Restrictive policies required
4. ✅ **Never expose** service role key to client

### Input Validation

**Rules:**
1. ✅ **Validate all inputs** with Zod schemas
2. ✅ **Sanitize user input** before database operations
3. ✅ **Use parameterized queries** (Supabase handles this)
4. ✅ **Rate limiting** for public endpoints (implement as needed)

### Secrets Management

**Rules:**
1. ✅ **Never commit** secrets to repository
2. ✅ **Use environment variables** for all secrets
3. ✅ **Use `.env.example`** template (without values)
4. ✅ **Rotate secrets** regularly in production

---

## Performance Guidelines

### Database Queries

**Rules:**
1. ✅ **Use indexes** for frequently queried columns
2. ✅ **Avoid N+1 queries** - use joins or batch loading
3. ✅ **Limit result sets** - use pagination for large datasets
4. ✅ **Cache frequently accessed data** in React Query

**Example:**
```typescript
// ✅ GOOD - Batch loading
const { data: events } = await supabase
  .from('events')
  .select(`
    *,
    client:clients(*),
    courses(*)
  `)
  .limit(20);

// ❌ BAD - N+1 query
for (const event of events) {
  const client = await getClient(event.client_id);
}
```

### React Performance

**Rules:**
1. ✅ **Memoize expensive computations** with `useMemo`
2. ✅ **Memoize callbacks** with `useCallback` for props
3. ✅ **Avoid unnecessary re-renders** with React.memo
4. ✅ **Code splitting** for large components (web)

**Example:**
```typescript
// ✅ GOOD
const expensiveValue = useMemo(() => {
  return events.reduce((sum, e) => sum + e.guest_count, 0);
}, [events]);

const handleClick = useCallback(() => {
  onPress(event.id);
}, [event.id, onPress]);
```

### Real-time Performance

**Rules:**
1. ✅ **Subscribe only to needed tables/columns**
2. ✅ **Unsubscribe** when component unmounts
3. ✅ **Batch updates** if multiple changes expected
4. ✅ **Debounce rapid updates** if needed

---

## Code Review Standards

### Review Checklist

**All PRs must meet these requirements:**

- [ ] **Code Style:** Follows TypeScript and formatting rules
- [ ] **Naming:** Follows naming conventions (database, TypeScript, files)
- [ ] **Types:** All code properly typed (no `any`)
- [ ] **Error Handling:** Errors handled appropriately
- [ ] **Testing:** New features have tests (if applicable)
- [ ] **Documentation:** Code is documented, docs updated if needed
- [ ] **Performance:** No obvious performance issues
- [ ] **Security:** No security vulnerabilities introduced
- [ ] **Breaking Changes:** Breaking changes documented

### Review Process

**Rules:**
1. ✅ **At least one approval** required before merge
2. ✅ **All comments addressed** before merge
3. ✅ **CI checks pass** (lint, type check, tests)
4. ✅ **No force push** to main branch
5. ✅ **Squash merge** preferred for clean history

### Review Feedback

**Guidelines:**
- ✅ **Be constructive** - suggest improvements, don't just criticize
- ✅ **Explain why** - provide context for requested changes
- ✅ **Approved with suggestions** - minor issues that can be addressed later
- ✅ **Request changes** - for critical issues blocking merge

---

## Architecture Principles

### Separation of Concerns

**Rules:**
1. ✅ **Service layer** handles data operations (Supabase, API calls)
2. ✅ **Component layer** handles UI and user interactions
3. ✅ **Context layer** manages global state and real-time subscriptions
4. ✅ **Types layer** defines shared TypeScript types

**File Structure:**
```
lib/
  supabase-kds.ts          # Service layer
  kds-context-realtime.tsx # Context layer
components/
  event-form.tsx           # Component layer
shared/
  types.ts                 # Types layer
```

### DRY (Don't Repeat Yourself)

**Rules:**
1. ✅ **Extract reusable logic** into utility functions
2. ✅ **Create shared components** for repeated UI patterns
3. ✅ **Use service functions** instead of duplicating queries
4. ✅ **Share types** via `shared/types.ts`

### YAGNI (You Aren't Gonna Need It)

**Rules:**
1. ✅ **Build only what's needed** - avoid over-engineering
2. ✅ **Add complexity** only when actually required
3. ✅ **Refactor** when patterns emerge naturally

---

## Quick Reference

### Command Cheat Sheet

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

# Database
# Run migrations in Supabase SQL Editor
```

### Common Patterns

**Create a new feature:**
1. Create migration (if database changes)
2. Create service functions
3. Create components
4. Add routes/pages
5. Update documentation

**Add a new screen/page:**
1. Create file following naming conventions
2. Use existing layout patterns
3. Add to navigation if needed
4. Test functionality

**Fix a bug:**
1. Reproduce the issue
2. Write test case (if applicable)
3. Fix the code
4. Verify fix works
5. Update tests if needed

---

## Enforcement

### Pre-commit Hooks (Recommended)

**Set up:**
- TypeScript type checking
- ESLint
- Prettier formatting
- Test execution

### CI/CD (Recommended)

**Checks:**
- Linting
- Type checking
- Test execution
- Build verification

### Code Review

**All code** must be reviewed before merging to `main` branch.

---

## Exceptions & Legacy Code

### Legacy Code

**Rules:**
1. ✅ **Follow new rules** for all new code
2. ✅ **Refactor legacy code** when touching it (if low risk)
3. ✅ **Document exceptions** if refactoring is high risk
4. ✅ **Never mix** old and new conventions in same file

### Exceptions

**Exceptions to rules** must be:
1. ✅ **Documented** with reason
2. ✅ **Approved** by team lead
3. ✅ **Time-bound** (plan to fix later)

---

## Updates to Rules

### Process

**To update project rules:**
1. Create issue/PR with proposed changes
2. Discuss with team
3. Update `PROJECT_RULES.md`
4. Announce changes to team
5. Update `DEVELOPER_GUIDE.md` if needed

---

**Last Updated:** January 2026  
**Maintained By:** Development Team  
**Questions?** See `DEVELOPER_GUIDE.md` or ask in code review
