# Offline Queue System Guide

## Overview

The offline queue system enables the mobile app to continue functioning when the device loses internet connectivity. All data modifications (create, update, delete) are automatically queued and synced when the connection is restored.

## Architecture

### Components

1. **OfflineQueueStorage** - Persists operations to device storage (AsyncStorage/localStorage)
2. **OfflineSyncManager** - Manages sync operations, connection detection, and retry logic
3. **OfflineDatabaseWrapper** - Wraps database operations to add offline support
4. **React Hooks** - Provide easy integration with React components

### Data Flow

```
User Action (Create/Update/Delete)
    ↓
OfflineDatabaseWrapper
    ↓
Is Online? → Yes → Execute on Supabase
         → No  → Queue Operation
    ↓
Store in Device Storage (AsyncStorage/localStorage)
    ↓
Connection Restored
    ↓
OfflineSyncManager detects connection
    ↓
Retrieve queued operations
    ↓
Execute in order (by priority, then timestamp)
    ↓
Mark as synced or failed
    ↓
Emit events to UI
```

## Usage

### Basic Setup

```typescript
import { createClient } from '@supabase/supabase-js';
import { CateringDatabase } from '@/shared/supabase-service';
import { getOfflineDatabaseWrapper } from '@/shared/offline-database-wrapper';

const supabase = createClient(url, key);
const db = new CateringDatabase(supabase);
const offlineDb = getOfflineDatabaseWrapper(supabase, db);

// Now use offlineDb instead of db
// It automatically handles offline scenarios
```

### Using React Hooks

#### Sync Status Hook

Monitor the current sync state:

```typescript
import { useSyncStatus, useOfflineSyncManager } from '@/shared/use-offline-sync';

export function MyComponent() {
  const syncManager = useOfflineSyncManager(supabase, db);
  const status = useSyncStatus(syncManager);

  return (
    <div>
      <p>Online: {status.isOnline ? '✓' : '✗'}</p>
      <p>Syncing: {status.isSyncing ? 'Yes' : 'No'}</p>
      <p>Pending: {status.pendingOperations}</p>
      <p>Failed: {status.failedOperations}</p>
    </div>
  );
}
```

#### Create with Offline Support

```typescript
import { useOfflineCreate } from '@/shared/use-offline-sync';

export function CreateClientForm() {
  const syncManager = useOfflineSyncManager(supabase, db);
  const { create, isLoading, error } = useOfflineCreate(syncManager, {
    entityType: 'client',
    priority: 1,
    onSuccess: (data) => console.log('Created:', data),
    onError: (error) => console.error('Error:', error),
  });

  const handleSubmit = async (formData) => {
    const result = await create(formData);
    // Result includes temporary ID for UI reference
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Create'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

#### Update with Offline Support

```typescript
import { useOfflineUpdate } from '@/shared/use-offline-sync';

export function EditClientForm({ clientId }) {
  const syncManager = useOfflineSyncManager(supabase, db);
  const { update, isLoading, error } = useOfflineUpdate(syncManager, {
    entityType: 'client',
    priority: 1,
  });

  const handleSubmit = async (formData) => {
    await update(clientId, formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isLoading}>Update</button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

#### Delete with Offline Support

```typescript
import { useOfflineDelete } from '@/shared/use-offline-sync';

export function DeleteClientButton({ clientId }) {
  const syncManager = useOfflineSyncManager(supabase, db);
  const { delete: deleteClient, isLoading } = useOfflineDelete(syncManager, {
    entityType: 'client',
  });

  return (
    <button onClick={() => deleteClient(clientId)} disabled={isLoading}>
      {isLoading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

#### Monitor Pending Operations

```typescript
import { usePendingOperations } from '@/shared/use-offline-sync';

export function PendingOperationsList() {
  const syncManager = useOfflineSyncManager(supabase, db);
  const { operations, isLoading } = usePendingOperations(syncManager);

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {operations.map((op) => (
        <li key={op.id}>
          {op.type} {op.entityType} - {op.status}
        </li>
      ))}
    </ul>
  );
}
```

#### Monitor Failed Operations

```typescript
import { useFailedOperations } from '@/shared/use-offline-sync';

export function FailedOperationsList() {
  const syncManager = useOfflineSyncManager(supabase, db);
  const { operations, retry } = useFailedOperations(syncManager);

  return (
    <ul>
      {operations.map((op) => (
        <li key={op.id}>
          <p>{op.lastError}</p>
          <button onClick={() => retry(op.id)}>Retry</button>
        </li>
      ))}
    </ul>
  );
}
```

#### Manual Sync Trigger

```typescript
import { useManualSync } from '@/shared/use-offline-sync';

export function ManualSyncButton() {
  const syncManager = useOfflineSyncManager(supabase, db);
  const { sync, isLoading, lastSyncTime } = useManualSync(syncManager);

  return (
    <div>
      <button onClick={sync} disabled={isLoading}>
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </button>
      {lastSyncTime && (
        <p>Last synced: {new Date(lastSyncTime).toLocaleTimeString()}</p>
      )}
    </div>
  );
}
```

### Event Listening

Listen for offline queue events:

```typescript
const syncManager = useOfflineSyncManager(supabase, db);

// Operation added to queue
syncManager.on('operation_added', (event) => {
  console.log('Operation queued:', event.data.operation);
});

// Operation synced successfully
syncManager.on('operation_synced', (event) => {
  console.log('Operation synced:', event.data.result);
});

// Operation failed
syncManager.on('operation_failed', (event) => {
  console.log('Operation failed:', event.data.error);
});

// Sync started
syncManager.on('sync_started', () => {
  console.log('Sync started');
});

// Sync completed
syncManager.on('sync_completed', (event) => {
  console.log('Sync completed:', event.data.results);
});

// Connection changed
syncManager.on('connection_changed', (event) => {
  console.log('Online:', event.data.isOnline);
});
```

## Operation Priority

Operations are synced in order of priority (highest first), then by timestamp:

- **Priority 2**: Events, Invoices (high importance)
- **Priority 1**: Clients, Staff (normal)
- **Priority 0**: Inventory (low importance)

## Conflict Resolution

The system uses a **last-write-wins** strategy by default:

1. When syncing, if the server version is newer, it's used
2. If the local version is newer, it overwrites the server version
3. For critical operations, implement custom conflict resolution

## Error Handling

### Automatic Retry

- Failed operations are retried up to 3 times
- Retry delay increases exponentially (1s, 2s, 4s)
- After max retries, operation is marked as failed

### Manual Retry

```typescript
const { operations, retry } = useFailedOperations(syncManager);

// Retry a specific operation
await retry(operationId);
```

### Error Recovery

```typescript
const { error } = useOfflineCreate(syncManager, {
  onError: (error) => {
    if (error.code === 'VALIDATION_ERROR') {
      // Handle validation error
    } else if (error.code === 'NETWORK_ERROR') {
      // Will be retried automatically
    } else {
      // Handle other errors
    }
  },
});
```

## Performance Considerations

1. **Batch Operations**: Queue multiple operations before syncing
2. **Priority**: Use priority to ensure critical operations sync first
3. **Storage**: Operations are stored in device storage (limited size)
4. **Network**: Sync happens automatically when connection restored
5. **Polling**: Auto-sync runs every 30 seconds when online

## Testing

Run the offline queue tests:

```bash
npm run test -- web/__tests__/offline-queue.test.ts
```

Tests cover:

- Storage operations (add, update, remove, clear)
- Sync manager functionality
- Connection detection
- Offline/online transitions
- Concurrent operations
- Error handling
- Performance

## Troubleshooting

### Operations not syncing

1. Check connection status: `syncManager.isOnlineStatus()`
2. Check pending operations: `await syncManager.getPendingOperationsAsync()`
3. Manually trigger sync: `await syncManager.sync()`

### Storage errors

The system automatically falls back from AsyncStorage → localStorage → in-memory storage.

If you see storage errors:

1. Check device storage space
2. Clear old operations: `await syncManager.clearQueue()`
3. Check browser console for details

### Duplicate operations

If you see duplicate operations:

1. Check operation IDs are unique
2. Verify sync completed before creating new operations
3. Use `useSyncStatus` to wait for sync completion

## Best Practices

1. **Always use offline-aware operations** for user data
2. **Show sync status** in the UI (online/offline indicator)
3. **Handle errors gracefully** - show user-friendly messages
4. **Test offline scenarios** - simulate network disconnection
5. **Monitor failed operations** - provide retry mechanism
6. **Use appropriate priority** - critical operations first
7. **Clean up old operations** - periodically clear synced operations

## API Reference

### OfflineSyncManager

```typescript
// Sync operations
await syncManager.sync(options?)
await syncManager.syncOperation(operationId, options?)
await syncManager.syncBatch(operationIds)

// Queue management
await syncManager.addToQueue(operation)
await syncManager.removeFromQueue(operationId)
await syncManager.clearQueue()

// Status
syncManager.isOnlineStatus()
await syncManager.getStatusAsync()
await syncManager.getPendingOperationsAsync()
await syncManager.getFailedOperationsAsync()

// Connection
syncManager.setOnline(online)

// Events
syncManager.on(event, listener)
syncManager.off(event, listener)
```

### React Hooks

```typescript
// Status monitoring
useSyncStatus(syncManager)
useQueueStatistics(syncManager)

// Operations
useOfflineCreate(syncManager, options)
useOfflineUpdate(syncManager, options)
useOfflineDelete(syncManager, options)

// Monitoring
usePendingOperations(syncManager)
useFailedOperations(syncManager)

// Manual control
useManualSync(syncManager)
```

## Future Enhancements

1. **Conflict Resolution UI** - Allow user to choose which version to keep
2. **Operation Compression** - Combine multiple updates to same entity
3. **Selective Sync** - Allow user to choose which operations to sync
4. **Bandwidth Optimization** - Compress data before syncing
5. **Analytics** - Track offline usage patterns
6. **Encryption** - Encrypt sensitive data in storage
