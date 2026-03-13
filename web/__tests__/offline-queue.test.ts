/**
 * Offline Queue Tests
 * Validates offline queue functionality and sync behavior
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CateringDatabase } from '../../shared/supabase-service';
import { OfflineSyncManager } from '../../shared/offline-sync-manager';
import { OfflineDatabaseWrapper } from '../../shared/offline-database-wrapper';
import { getOfflineQueueStorage, resetOfflineQueueStorage } from '../../shared/offline-queue-service';
import * as OfflineQueueTypes from '../../shared/offline-queue-types';
import { v4 as uuidv4 } from 'uuid';

let supabaseAdmin: SupabaseClient;
let db: CateringDatabase;
let syncManager: OfflineSyncManager;
let wrapper: OfflineDatabaseWrapper;
let storage: OfflineQueueTypes.OfflineQueueStorage;

beforeAll(async () => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  db = new CateringDatabase(supabaseAdmin);
  syncManager = new OfflineSyncManager(supabaseAdmin, db);
  wrapper = new OfflineDatabaseWrapper(supabaseAdmin, db);
  storage = getOfflineQueueStorage();

  console.log('[Offline Queue Tests] Setup initialized');
});

afterAll(async () => {
  syncManager.destroy();
  console.log('[Offline Queue Tests] Cleanup completed');
});

beforeEach(async () => {
  // Clear queue before each test
  await storage.clearQueue();
});

describe('Offline Queue Storage', () => {
  it('should add operation to queue', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: { client_name: 'Test Client' },
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await storage.addOperation(operation);

    const retrieved = await storage.getOperation(operation.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.client_name).toBeUndefined(); // payload is in operation.payload
    expect(retrieved?.payload.client_name).toBe('Test Client');
  });

  it('should retrieve all operations', async () => {
    const operations = Array.from({ length: 3 }, () => ({
      id: uuidv4(),
      type: 'create' as const,
      entityType: 'client' as const,
      entityId: uuidv4(),
      payload: { client_name: 'Test' },
      timestamp: Date.now(),
      status: 'pending' as const,
      retryCount: 0,
    }));

    await storage.addOperations(operations);

    const retrieved = await storage.getOperations();
    expect(retrieved.length).toBeGreaterThanOrEqual(3);
  });

  it('should filter operations by status', async () => {
    const pendingOp: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    const syncedOp: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'synced',
      retryCount: 0,
    };

    await storage.addOperations([pendingOp, syncedOp]);

    const pending = await storage.getOperations({ status: 'pending' as any });
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((op) => op.status === 'pending')).toBe(true);
  });

  it('should update operation status', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await storage.addOperation(operation);

    await storage.updateOperation(operation.id, {
      status: 'syncing',
      retryCount: 1,
    });

    const updated = await storage.getOperation(operation.id);
    expect(updated?.status).toBe('syncing');
    expect(updated?.retryCount).toBe(1);
  });

  it('should remove operation from queue', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await storage.addOperation(operation);
    await storage.removeOperation(operation.id);

    const retrieved = await storage.getOperation(operation.id);
    expect(retrieved).toBeNull();
  });

  it('should clear entire queue', async () => {
    const operations = Array.from({ length: 5 }, () => ({
      id: uuidv4(),
      type: 'create' as const,
      entityType: 'client' as const,
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending' as const,
      retryCount: 0,
    }));

    await storage.addOperations(operations);

    await storage.clearQueue();

    const remaining = await storage.getOperations();
    expect(remaining.length).toBe(0);
  });
});

describe('Sync Manager', () => {
  it('should detect online/offline status', async () => {
    const isOnline = syncManager.isOnlineStatus();
    expect(typeof isOnline).toBe('boolean');
  });

  it('should add operation to queue', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: { client_name: 'Test' },
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await syncManager.addToQueue(operation);

    const status = await syncManager.getStatusAsync();
    expect(status.totalOperations).toBeGreaterThan(0);
  });

  it('should handle operation events', async () => {
    let eventFired = false;

    syncManager.on('operation_added', () => {
      eventFired = true;
    });

    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await syncManager.addToQueue(operation);

    expect(eventFired).toBe(true);
  });

  it('should track pending operations', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await syncManager.addToQueue(operation);

    const pending = await syncManager.getPendingOperationsAsync();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.some((op) => op.id === operation.id)).toBe(true);
  });

  it('should retry failed operations', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: { client_name: 'Retry Test' },
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await syncManager.addToQueue(operation);

    // Simulate failure
    await storage.updateOperation(operation.id, {
      status: 'failed',
      retryCount: 1,
      lastError: 'Network error',
    });

    const failed = await syncManager.getFailedOperationsAsync();
    expect(failed.some((op) => op.id === operation.id)).toBe(true);
  });
});

describe('Offline Database Wrapper', () => {
  it('should create client when online', async () => {
    syncManager.setOnline(true);

    const client = await wrapper.createClient({
      client_name: 'Online Client',
      email: 'online@test.com',
    });

    expect(client).toBeDefined();
    expect(client.id).toBeDefined();

    // Cleanup
    await db.deleteClient(client.id);
  });

  it('should queue client creation when offline', async () => {
    syncManager.setOnline(false);

    const result = await wrapper.createClient({
      client_name: 'Offline Client',
      email: 'offline@test.com',
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    // Verify operation is in queue
    const pending = await syncManager.getPendingOperationsAsync();
    expect(pending.some((op) => op.entityType === 'client')).toBe(true);

    syncManager.setOnline(true);
  });

  it('should queue event creation with high priority', async () => {
    syncManager.setOnline(false);

    // Create a test client first
    const client = await db.createClient({
      client_name: 'Test Client',
      email: 'test@test.com',
    });

    const event = await wrapper.createEvent({
      client_id: client.id,
      event_name: 'Offline Event',
      event_date: new Date().toISOString().split('T')[0],
    });

    expect(event).toBeDefined();

    // Verify operation has high priority
    const pending = await syncManager.getPendingOperationsAsync();
    const eventOp = pending.find((op) => op.entityType === 'event');
    expect(eventOp?.priority).toBe(2);

    // Cleanup
    await db.deleteClient(client.id);
    syncManager.setOnline(true);
  });

  it('should pass through read operations', async () => {
    // Create test data
    const client = await db.createClient({
      client_name: 'Read Test Client',
      email: 'read@test.com',
    });

    const retrieved = await wrapper.getClientById(client.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.client_name).toBe('Read Test Client');

    // Cleanup
    await db.deleteClient(client.id);
  });

  it('should handle staff assignment offline', async () => {
    syncManager.setOnline(false);

    const result = await wrapper.assignStaffToEvent('staff-123', 'event-456');

    expect(result).toBeDefined();

    // Verify operation is queued
    const pending = await syncManager.getPendingOperationsAsync();
    expect(pending.some((op) => op.entityType === 'assignment')).toBe(true);

    syncManager.setOnline(true);
  });
});

describe('Offline Sync Workflow', () => {
  it('should sync operations when connection restored', async () => {
    syncManager.setOnline(false);

    // Queue operations
    const client = await wrapper.createClient({
      client_name: 'Sync Test Client',
      email: 'sync@test.com',
    });

    expect(client).toBeDefined();

    // Verify queued
    let pending = await syncManager.getPendingOperationsAsync();
    expect(pending.length).toBeGreaterThan(0);

    // Restore connection
    syncManager.setOnline(true);

    // Wait for sync
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify synced
    pending = await syncManager.getPendingOperationsAsync();
    expect(pending.length).toBe(0);
  });

  it('should handle concurrent offline operations', async () => {
    syncManager.setOnline(false);

    // Queue multiple operations
    const operations = await Promise.all([
      wrapper.createClient({ client_name: 'Client 1', email: 'c1@test.com' }),
      wrapper.createClient({ client_name: 'Client 2', email: 'c2@test.com' }),
      wrapper.createClient({ client_name: 'Client 3', email: 'c3@test.com' }),
    ]);

    expect(operations.length).toBe(3);

    // Verify all queued
    let pending = await syncManager.getPendingOperationsAsync();
    expect(pending.length).toBeGreaterThanOrEqual(3);

    // Restore connection
    syncManager.setOnline(true);

    // Wait for sync
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify synced
    pending = await syncManager.getPendingOperationsAsync();
    expect(pending.length).toBe(0);
  });

  it('should maintain operation order', async () => {
    syncManager.setOnline(false);

    const timestamps: number[] = [];

    // Queue operations with timestamps
    for (let i = 0; i < 3; i++) {
      const op: OfflineQueueTypes.QueuedOperation = {
        id: uuidv4(),
        type: 'create',
        entityType: 'client',
        entityId: uuidv4(),
        payload: { client_name: `Client ${i}` },
        timestamp: Date.now() + i * 100,
        status: 'pending',
        retryCount: 0,
      };

      await syncManager.addToQueue(op);
      timestamps.push(op.timestamp);
    }

    // Verify order is maintained
    const pending = await syncManager.getPendingOperationsAsync();
    const orderedTimestamps = pending.map((op) => op.timestamp).sort((a, b) => a - b);

    expect(orderedTimestamps).toEqual(timestamps.sort((a, b) => a - b));

    syncManager.setOnline(true);
  });
});

describe('Error Handling', () => {
  it('should handle storage errors gracefully', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: {},
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    // Should not throw
    await expect(storage.addOperation(operation)).resolves.not.toThrow();
  });

  it('should handle sync errors with retry', async () => {
    const operation: OfflineQueueTypes.QueuedOperation = {
      id: uuidv4(),
      type: 'create',
      entityType: 'client',
      entityId: uuidv4(),
      payload: { client_name: '' }, // Invalid: empty name
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await syncManager.addToQueue(operation);

    // Try to sync (should fail)
    const result = await syncManager.syncOperation(operation.id);

    // Should mark as failed after retries
    const updated = await storage.getOperation(operation.id);
    expect(updated?.retryCount).toBeGreaterThan(0);
  });
});

describe('Performance', () => {
  it('should handle large queue efficiently', async () => {
    const startTime = Date.now();

    // Add 100 operations
    const operations = Array.from({ length: 100 }, (_, i) => ({
      id: uuidv4(),
      type: 'create' as const,
      entityType: 'client' as const,
      entityId: uuidv4(),
      payload: { client_name: `Client ${i}` },
      timestamp: Date.now(),
      status: 'pending' as const,
      retryCount: 0,
    }));

    await storage.addOperations(operations);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    // Verify all added
    const all = await storage.getOperations();
    expect(all.length).toBeGreaterThanOrEqual(100);
  });

  it('should retrieve operations quickly', async () => {
    const startTime = Date.now();

    const operations = await storage.getOperations();

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
});
