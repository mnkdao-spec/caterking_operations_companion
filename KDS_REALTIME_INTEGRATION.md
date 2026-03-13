# KDS Real-Time Integration Guide

## Overview

The CaterKing KDS (Kitchen Display System) has been enhanced with real-time data synchronization using Supabase, enabling multi-tablet coordination and live order tracking across all kitchen stations.

## Architecture

### Database Schema

Five new Supabase tables power the real-time KDS system:

**kds_table_groups** — Stores table group information for the expo (overview) screen, including guest counts and course status tracking.

**kds_orders** — Individual order items for station and plating screens, with status tracking (pending → fired → in_progress → ready → completed).

**kds_stations** — Station status and queue information, updated in real-time as orders progress through each station.

**kds_inventory** — Inventory levels for menu items during events, supporting the transaction-based inventory decrement system.

**kds_unprocessed_items** — Tracks orders that failed to process, enabling the error recovery system to retry failed operations.

### Real-Time Hooks

Four custom React hooks provide real-time data subscriptions:

| Hook | Purpose | Parameters | Returns |
|------|---------|-----------|---------|
| `useKDSTableGroups()` | Subscribe to table groups | `eventId` | `tableGroups, loading, error` |
| `useKDSOrders()` | Subscribe to orders | `eventId, stationType?` | `orders, loading, error` |
| `useKDSStations()` | Subscribe to station status | `eventId` | `stations, loading, error` |
| `useKDSInventory()` | Subscribe to inventory | `eventId` | `inventory, loading, error` |
| `useKDSRealtimeData()` | Subscribe to all data | `eventId, stationType?` | `tableGroups, orders, stations, inventory, loading, error` |

Each hook includes automatic initial fetch + real-time updates via Supabase Realtime subscriptions.

## Implementation

### 1. Apply Database Migration

Run the migration to create all KDS tables and enable real-time subscriptions:

```bash
# From project root
npm run db:push

# Or manually apply the migration
supabase migration up
```

The migration creates:
- Five KDS tables with proper indexes
- Row-level security (RLS) policies for event-based access control
- Automatic `updated_at` timestamp triggers
- Real-time replication for all tables

### 2. KDS Screen Integration

All three KDS screens (expo, station, plating) have been updated to use real-time hooks:

**expo.tsx** — Uses `useKDSRealtimeData()` to fetch table groups and station status. Falls back to mock data if Supabase is unavailable.

**station.tsx** — Uses `useKDSRealtimeData(eventId, stationType)` to fetch orders for a specific station. Automatically filters by station type.

**plating.tsx** — Uses `useKDSRealtimeData(eventId, "plating")` to fetch plating orders. Supports batch operations on live data.

### 3. Error Recovery Integration

The `KDSErrorRecovery` component is integrated into all KDS screens and automatically:

- Detects unprocessed orders on screen load
- Displays a recovery panel if failures are found
- Allows operators to retry failed orders
- Updates UI when recovery completes

### 4. Operator Training

The `kds-help.tsx` screen provides comprehensive training on:

- Error recovery workflow
- Transaction rollback behavior
- Best practices for order completion
- Troubleshooting common issues
- Quick tips for efficiency

## Data Flow

### Order Completion Flow

```
1. Operator marks order as complete in KDS screen
2. handleOrderItemCompletion() called with order ID
3. System creates inventory transaction:
   - Mark order as completed
   - Decrement inventory for menu items
4. If inventory decrement fails:
   - Entire transaction is rolled back
   - Order status remains unchanged
   - Error is logged to kds_unprocessed_items
5. If transaction succeeds:
   - Order status updated to "completed"
   - Inventory decremented
   - All tablets receive real-time update via Supabase
6. KDSErrorRecovery detects any unprocessed items
   - Displays recovery panel
   - Allows operator to retry
```

### Multi-Tablet Synchronization

When one tablet updates an order:

1. Change is written to Supabase database
2. Supabase Realtime broadcasts change to all subscribed clients
3. Real-time hooks receive the update
4. UI automatically re-renders with new data
5. All tablets show consistent state within milliseconds

## Configuration

### Environment Variables

Ensure your `.env.local` file includes:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Event ID

Currently, all KDS screens use a hardcoded event ID:

```typescript
const [eventId] = useState("event-wedding");
```

In production, pass the event ID from navigation params:

```typescript
const params = useLocalSearchParams<{ eventId: string }>();
const [eventId] = useState(params.eventId || "event-wedding");
```

## Testing

### Local Testing

1. Start the dev server: `npm run dev`
2. Open KDS screens on multiple devices/tabs
3. Mark orders as complete on one screen
4. Verify updates appear on other screens within 1-2 seconds

### Multi-Tablet Testing

1. Deploy to staging environment
2. Open KDS screens on multiple tablets on same WiFi
3. Test order completion across stations
4. Test error recovery by manually creating unprocessed items
5. Verify all tablets sync correctly

## Troubleshooting

### Orders not updating in real-time

**Issue:** Changes on one tablet don't appear on others

**Solution:**
- Verify all tablets are connected to same WiFi
- Check Supabase Realtime is enabled: Settings → Realtime → Enable Realtime
- Verify RLS policies are correct: `event_users` table must have user-event relationships
- Check browser console for Supabase connection errors

### Unprocessed items keep appearing

**Issue:** Error recovery panel shows same items repeatedly

**Solution:**
- Check inventory levels in main app
- Verify inventory transaction system is working
- Check Supabase logs for transaction errors
- Manually update `kds_unprocessed_items` table to clear old entries

### Loading state never completes

**Issue:** KDS screens show "Loading KDS Data..." indefinitely

**Solution:**
- Verify Supabase connection is working
- Check network tab in browser DevTools
- Verify event ID exists in database
- Check RLS policies allow user to read data

## Performance Optimization

### Subscription Filtering

Real-time hooks use Supabase filters to minimize data transfer:

```typescript
// Only subscribe to orders for this station
useKDSOrders(eventId, "grill")

// Only subscribe to table groups for this event
useKDSTableGroups(eventId)
```

### Batch Updates

For high-volume updates (e.g., "Plate All Ready"), batch operations into single transaction:

```typescript
// Good: Single transaction for multiple items
await handleBatchOrderCompletion(orderIds)

// Avoid: Multiple individual transactions
for (const orderId of orderIds) {
  await handleOrderItemCompletion(orderId)
}
```

### Connection Pooling

Supabase automatically manages connection pooling. For high-traffic events, consider:

- Increasing Supabase project tier
- Implementing local caching for frequently accessed data
- Using Supabase Edge Functions for complex operations

## Security

### Row-Level Security (RLS)

All KDS tables use RLS policies to ensure users can only access data for their assigned events:

```sql
CREATE POLICY "kds_orders_select" ON public.kds_orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_users WHERE event_id = kds_orders.event_id
    )
  );
```

### Data Validation

All order completion operations validate:

- User has access to event
- Order exists and belongs to event
- Inventory is available
- Transaction can be completed atomically

## Future Enhancements

1. **Offline Support** — Cache orders locally and sync when connection restored
2. **Predictive Analytics** — Estimate order completion times based on historical data
3. **Advanced Filtering** — Filter orders by course, table, or priority
4. **Voice Commands** — Mark orders complete via voice
5. **Mobile Notifications** — Alert operators when orders are ready
6. **Analytics Dashboard** — Track KDS performance metrics

## Support

For issues or questions:

1. Check this guide's Troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check KDS operator training: `app/kds/help.tsx`
4. Contact your development team

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
