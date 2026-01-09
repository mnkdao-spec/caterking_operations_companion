# CaterKing KDS Real-Time Integration Guide

This document explains how to set up and use the real-time Kitchen Display System (KDS) with Supabase.

## Architecture Overview

The KDS system uses a **Hybrid Course-Fire Model** with real-time synchronization across multiple tablets:

- **Expo Station**: Command center where the event lead fires courses for table groups
- **Station Displays**: Individual tablets for each kitchen station (Grill, Sauté, Garde Manger, Dessert)
- **Plating Station**: Coordinates final assembly when all components are ready
- **Real-Time Sync**: All tablets receive live updates via Supabase Realtime WebSocket subscriptions

## Database Schema

The system uses six main tables:

| Table | Purpose |
|-------|---------|
| `events` | Catering events with guest counts and timing |
| `courses` | Course definitions (Appetizers, Salads, Main, Dessert) |
| `menu_items` | Individual dishes with station assignments |
| `table_groups` | Table groupings (Tables 1-4, etc.) |
| `fired_courses` | Instances of courses fired for specific table groups |
| `order_items` | Individual dishes to prepare with status tracking |

## Setup Instructions

### 1. Initialize Supabase Database

Run the migration to create all tables:

```bash
# From the project root
pnpm db:push
```

Or manually execute the SQL in `supabase/migrations/001_kds_schema.sql` in your Supabase dashboard.

### 2. Configure Environment Variables

Ensure your `.env` file contains:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 3. Enable Realtime on Tables

In your Supabase dashboard, enable Realtime for these tables:
- `fired_courses`
- `order_items`

Go to **Database** → **Replication** and toggle on for each table.

## Usage

### Loading an Event

```typescript
import { useKDSRealtime } from "@/lib/kds-context-realtime";

function MyComponent() {
  const { loadEvent, subscribeToUpdates, currentEvent } = useKDSRealtime();

  useEffect(() => {
    // Load active event (or pass specific eventId)
    loadEvent();
    
    // Subscribe to real-time updates
    subscribeToUpdates();
  }, []);

  return <Text>{currentEvent?.name}</Text>;
}
```

### Firing a Course

```typescript
const { fireCourse } = useKDSRealtime();

// Fire the main course for Tables 1-4
await fireCourse("table-group-id", 3); // courseNumber = 3
```

### Getting Station Queue

```typescript
const { getStationQueue } = useKDSRealtime();

const grillQueue = getStationQueue("grill");
// Returns: { stationType: "grill", items: [...] }
```

### Bumping an Item (Marking as Done)

```typescript
const { bumpItem } = useKDSRealtime();

await bumpItem("order-item-id");
// Automatically updates course status to "ready" when all items are done
```

### Plating Operations

```typescript
const { getPlatingQueue, markCoursePlated } = useKDSRealtime();

const readyCourses = getPlatingQueue(); // Courses with all items done

await markCoursePlated("fired-course-id"); // Mark as served
```

## Offline Resilience

The system includes an offline queue that automatically syncs when connectivity is restored:

```typescript
import { offlineQueue } from "@/lib/offline-queue";

// Actions are automatically queued if offline
await bumpItem("item-id"); // Works offline, syncs when back online

// Manually check queue status
const queue = await offlineQueue.getQueue();
const status = await offlineQueue.getSyncStatus();
```

## Real-Time Subscriptions

Subscriptions are automatically managed by the context:

```typescript
const { subscribeToUpdates, unsubscribeFromUpdates } = useKDSRealtime();

// Subscribe on mount
useEffect(() => {
  subscribeToUpdates();
  return () => unsubscribeFromUpdates();
}, []);
```

The system subscribes to:
- **Fired Courses**: Changes to course status across all stations
- **Order Items**: Updates to individual dish status

## Multi-Tablet Synchronization

When multiple tablets are running the KDS:

1. **Expo Station** fires a course
2. All **Station Displays** receive the new order via Realtime
3. When a station bumps an item, all tablets see the update
4. **Plating Station** sees when items are ready
5. When plated, all tablets update the course status

This ensures perfect synchronization without polling.

## Error Handling

The context provides error state:

```typescript
const { error, isLoading } = useKDSRealtime();

if (error) {
  return <Text>Error: {error}</Text>;
}

if (isLoading) {
  return <Text>Loading...</Text>;
}
```

## Performance Considerations

- **Indexes**: All foreign keys and status fields are indexed for fast queries
- **Realtime Limits**: Configured for 10 events per second per channel
- **Denormalization**: `station` field in `order_items` for quick filtering
- **Batch Operations**: Fire entire courses at once, not individual items

## Testing

Run the test suite:

```bash
pnpm test
```

Tests validate:
- Data structure integrity
- Status transitions
- Timer calculations
- Queue filtering logic
- Course completion logic

## Troubleshooting

### Realtime Not Updating

1. Check that Realtime is enabled on tables in Supabase dashboard
2. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
3. Check browser console for WebSocket errors
4. Ensure RLS policies allow read/write access

### Offline Queue Not Syncing

1. Check network connectivity
2. Verify `AsyncStorage` is working on the device
3. Check `offlineQueue.getSyncStatus()` for current status
4. Manually trigger sync with `offlineQueue.processQueue(handler)`

### Performance Issues

1. Check that indexes are created (see migration file)
2. Reduce number of subscriptions if needed
3. Use `getStationQueue()` instead of filtering all items
4. Consider pagination for large events

## Future Enhancements

- [ ] Sound/vibration alerts for new orders
- [ ] Inventory integration (auto-decrement on bump)
- [ ] Staff assignment and task delegation
- [ ] Analytics and performance metrics
- [ ] Photo capture for plated dishes
- [ ] Kitchen timer integration
