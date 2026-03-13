---
description: "Database and code naming conventions: snake_case for database/forms, camelCase for TypeScript, PascalCase for components"
alwaysApply: true
---

# Naming Conventions

## Database & Forms

**Format:** `snake_case` for all database columns and form fields

- **Database columns:** `snake_case` (e.g., `guest_count`, `event_date`)
- **Form fields:** Must exactly match database column names
- **Foreign keys:** `{table}_id` (e.g., `event_id`, `client_id`)
- **Timestamps:** `{action}_at` (e.g., `created_at`, `updated_at`, `fired_at`)
- **Booleans:** `is_{property}` or `has_{property}` (e.g., `is_available`)
- **Primary keys:** Always named `id` (UUID type)

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

## TypeScript/JavaScript

**Format:** `camelCase` for variables/functions, `PascalCase` for components/types

- **Variables:** `camelCase` (e.g., `guestCount`, `eventDate`)
- **Functions:** `camelCase` with verb prefix (e.g., `getEvents`, `createEvent`)
- **Components:** `PascalCase` (e.g., `EventForm`, `ClientList`)
- **Types/Interfaces:** `PascalCase` with suffix (e.g., `EventData`, `EventFormProps`)
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `MAX_GUEST_COUNT`)

```typescript
// ✅ GOOD
const MAX_GUEST_COUNT = 500;
const guestCount = event.guest_count;

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventData) => void;
}

function EventForm({ event, onSubmit }: EventFormProps) {
  // implementation
}
```

## Files

- **Components:** `kebab-case.tsx` (e.g., `event-form.tsx`, `client-list.tsx`)
- **Utilities:** `kebab-case.ts` (e.g., `supabase-services.ts`, `date-utils.ts`)
- **Migrations:** `{number}_{description}.sql` (e.g., `015_add_invoices.sql`)

**Reference:** See `docs/naming_conventions.md` for complete naming standards
