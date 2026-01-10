---
description: "tRPC procedures, Supabase service layer patterns, error handling, and API endpoint conventions"
globs:
  - "server/**/*.ts"
  - "lib/supabase-*.ts"
  - "web/lib/supabase-*.ts"
  - "server/routers.ts"
---

# API & Services Rules

## tRPC Procedures

When creating tRPC procedures:

1. **Use typed procedures:** `publicProcedure` or `protectedProcedure`
2. **Validate inputs:** Use Zod schemas for all inputs
3. **Handle errors:** Return proper error responses
4. **Type outputs:** Explicit return types

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

## Supabase Services

When creating service functions:

1. **Service layer:** Create in `lib/` (mobile) or `web/lib/` (web)
2. **Error handling:** Handle Supabase errors gracefully
3. **Type safety:** Export TypeScript interfaces for data types
4. **Mock mode:** Support mock data when Supabase not configured

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

## API Endpoints

- **All API routes** must start with `/api/` for gateway routing
- **RESTful conventions** for HTTP routes
- **Use tRPC** for type-safe RPC calls (preferred)
- **Error responses** must follow consistent format
