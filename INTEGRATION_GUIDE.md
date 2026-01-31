# Cross-Platform Integration Guide

This guide explains how the mobile and web apps share data through Supabase and how to use the unified database layer.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  - Clients, Staff, Events, Invoices, Inventory      │   │
│  │  - Real-time subscriptions via Postgres Changes     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication (OAuth, Email/Password)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↑                                        ↑
         │                                        │
    ┌────┴────────────────────────────────────────┴────┐
    │   Shared Database Layer (shared/)               │
    │  ┌──────────────────────────────────────────┐   │
    │  │ supabase-service.ts (CateringDatabase)  │   │
    │  │ - CRUD operations for all entities      │   │
    │  │ - Real-time subscriptions               │   │
    │  │ - Filtering and pagination              │   │
    │  └──────────────────────────────────────────┘   │
    │  ┌──────────────────────────────────────────┐   │
    │  │ use-catering-database.ts (React Hooks) │   │
    │  │ - useClients, useEvents, useStaff      │   │
    │  │ - useInvoices, useInventory            │   │
    │  │ - Mutations (create, update, delete)   │   │
    │  └──────────────────────────────────────────┘   │
    │  ┌──────────────────────────────────────────┐   │
    │  │ auth-context.tsx (Authentication)      │   │
    │  │ - Session management                    │   │
    │  │ - OAuth integration                     │   │
    │  │ - User profile management              │   │
    │  └──────────────────────────────────────────┘   │
    │  ┌──────────────────────────────────────────┐   │
    │  │ database-types.ts (TypeScript Types)   │   │
    │  │ - Unified data models                   │   │
    │  │ - API response types                    │   │
    │  └──────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────┘
         ↑                                        ↑
         │                                        │
    ┌────┴──────────────────┐         ┌──────────┴────┐
    │   Mobile App (Expo)   │         │   Web App     │
    │  ┌──────────────────┐ │         │ ┌──────────┐  │
    │  │ app/ (screens)  │ │         │ │ app/     │  │
    │  │ lib/ (hooks)    │ │         │ │ pages/   │  │
    │  │ components/     │ │         │ │ components/  │
    │  └──────────────────┘ │         │ └──────────┘  │
    └───────────────────────┘         └──────────────┘
```

## Shared Files

All shared code is in the `shared/` directory:

### 1. **database-types.ts**
Defines TypeScript interfaces for all database entities:
- `Client`, `Staff`, `Event`, `MenuItem`
- `Invoice`, `InvoiceTemplate`, `InvoiceItem`
- `OrderItem`, `FiredCourse` (KDS)
- `InventoryItem`, `StaffAvailability`

```typescript
import * as DatabaseTypes from '@shared/database-types';

const client: DatabaseTypes.Client = {
  id: '...',
  client_name: 'Acme Corp',
  email: 'contact@acme.com',
  // ...
};
```

### 2. **supabase-service.ts**
Core database service with CRUD operations and real-time subscriptions:

```typescript
import { createCateringDatabase } from '@shared/supabase-service';

const db = createCateringDatabase(supabaseClient);

// CRUD Operations
const clients = await db.getClients(limit, offset);
const client = await db.getClientById(id);
const newClient = await db.createClient({ name: '...' });
const updated = await db.updateClient(id, { name: '...' });
await db.deleteClient(id);

// Real-time Subscriptions
const subscription = db.subscribeToEvents((payload) => {
  console.log('Event changed:', payload);
});
```

### 3. **use-catering-database.ts**
React hooks for easy integration in components:

```typescript
import { useEvents, useEventById, useCreateEvent } from '@shared/use-catering-database';

function EventList() {
  const { events, isLoading, error, refetch } = useEvents();
  const { createEvent } = useCreateEvent();

  return (
    <>
      {events.map(event => (
        <div key={event.id}>{event.event_name}</div>
      ))}
    </>
  );
}
```

### 4. **auth-context.tsx**
Authentication provider for managing user sessions:

```typescript
import { AuthProvider, useAuth } from '@shared/auth-context';

function App() {
  return (
    <AuthProvider supabase={supabaseClient}>
      <YourApp />
    </AuthProvider>
  );
}

function Profile() {
  const { user, signOut } = useAuth();
  return <div>Welcome, {user?.email}</div>;
}
```

## Usage Examples

### Mobile App (Expo)

```typescript
// app/(tabs)/events.tsx
import { useEvents } from '@shared/use-catering-database';
import { useAuth } from '@shared/auth-context';

export default function EventsScreen() {
  const { isAuthenticated } = useAuth();
  const { events, isLoading } = useEvents();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <FlatList
      data={events}
      renderItem={({ item }) => <EventCard event={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Web App (Next.js)

```typescript
// web/app/events/page.tsx
import { useEvents } from '@shared/use-catering-database';
import { useAuth } from '@shared/auth-context';

export default function EventsPage() {
  const { isAuthenticated } = useAuth();
  const { events, isLoading } = useEvents();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

## Real-Time Synchronization

Both apps automatically sync data in real-time through Supabase subscriptions:

```typescript
// Mobile app updates event
await db.updateEvent(eventId, { guest_count: 150 });

// Web app receives update instantly via subscription
// useEvents hook automatically refetches and updates UI
```

## Authentication Flow

1. **Sign In/Sign Up**: Use `useAuth()` hook
2. **Session Management**: Automatically persisted in AsyncStorage (mobile) / localStorage (web)
3. **OAuth**: Supports Google, GitHub, etc.
4. **Session Sync**: All tabs/windows stay in sync

```typescript
const { signIn, signUp, signOut, signInWithOAuth } = useAuth();

// Email/password
await signIn('user@example.com', 'password');

// OAuth
await signInWithOAuth('google');

// Sign out
await signOut();
```

## Data Consistency

The shared database layer ensures data consistency:

- **Foreign Key Constraints**: Enforced at database level
- **Transactions**: Multi-step operations are atomic
- **Timestamps**: All records have `created_at` and `updated_at`
- **Concurrent Updates**: Last-write-wins strategy with real-time sync

## Testing

Run integration tests to verify cross-platform sync:

```bash
# All integration tests
npm run test

# Specific test suite
npm run test -- web/__tests__/cross-platform-integration.test.ts

# Watch mode
npm run test -- --watch
```

## Performance Considerations

1. **Pagination**: Use `limit` and `offset` for large datasets
2. **Subscriptions**: Only subscribe to data you need
3. **Caching**: React Query handles caching automatically
4. **Offline**: Mobile app uses AsyncStorage for offline support

```typescript
// Paginate large datasets
const { events } = useEvents();
const { events: moreEvents } = useEvents({
  limit: 50,
  offset: 50,
});

// Unsubscribe when done
const subscription = db.subscribeToEvents(callback);
subscription.unsubscribe();
```

## Environment Setup

Both apps need the same Supabase credentials:

```bash
# Mobile app (.env.local)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key

# Web app (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Data not syncing
- Check Supabase connection: `console.log(supabase)`
- Verify subscriptions are active
- Check browser console for errors

### Authentication issues
- Ensure AuthProvider wraps your app
- Check session in browser DevTools
- Verify OAuth redirect URLs in Supabase

### Performance issues
- Use pagination for large lists
- Unsubscribe from unused subscriptions
- Check database query performance in Supabase dashboard

## Next Steps

1. **Implement offline sync**: Use AsyncStorage queue for mobile
2. **Add conflict resolution**: Handle concurrent edits
3. **Implement caching**: Add service worker for web
4. **Add analytics**: Track user actions across platforms
5. **Implement push notifications**: Alert users of changes

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review test files: `web/__tests__/cross-platform-integration.test.ts`
3. Check shared types: `shared/database-types.ts`
