---
description: "React Query for server state, Context API for client state, AsyncStorage for offline, and real-time subscriptions"
globs:
  - "app/**/*.tsx"
  - "lib/*context*.tsx"
  - "hooks/*.ts"
---

# State Management Rules

## Server State (React Query)

**Rules:**
1. **Use React Query** for all server state (mobile app)
2. **Query keys:** Use descriptive, hierarchical keys
3. **Cache invalidation:** Invalidate related queries on mutations
4. **Error handling:** Handle errors in query/mutation callbacks

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

## Client State (Context API)

**Rules:**
1. **Use Context API** for truly global state (KDS context, theme)
2. **Local state** for component-specific state (useState)
3. **Avoid prop drilling:** Use context for deeply nested props
4. **Memoize context values** to prevent unnecessary re-renders

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

## Local Storage (AsyncStorage)

**Rules:**
1. **Use AsyncStorage** for offline persistence (mobile app)
2. **Sync with server** when online
3. **Handle migration** if schema changes
4. **Prefix keys** to avoid conflicts

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

## Real-time Subscriptions

**Rules:**
1. **Subscribe to updates** in context or component
2. **Clean up subscriptions** on unmount
3. **Handle connection errors** gracefully
4. **Update local state** on changes

```typescript
// ✅ GOOD
useEffect(() => {
  const channel = supabase
    .channel('events-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
        // Handle update
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```
