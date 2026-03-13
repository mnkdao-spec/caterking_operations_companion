/**
 * Offline Database Wrapper
 * Wraps CateringDatabase to add offline queue functionality
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CateringDatabase } from './supabase-service';
import { OfflineSyncManager, getOfflineSyncManager } from './offline-sync-manager';
import * as OfflineQueueTypes from './offline-queue-types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// OFFLINE DATABASE WRAPPER
// ============================================================================

export class OfflineDatabaseWrapper {
  private db: CateringDatabase;
  private syncManager: OfflineSyncManager;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient, db: CateringDatabase) {
    this.supabase = supabase;
    this.db = db;
    this.syncManager = getOfflineSyncManager(supabase, db);
  }

  // ============================================================================
  // CLIENT OPERATIONS
  // ============================================================================

  async createClient(data: any) {
    // Try to create online first
    try {
      return await this.db.createClient(data);
    } catch (error) {
      // If offline, queue the operation
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: 'client',
          entityId: uuidv4(),
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 1,
        };

        await this.syncManager.addToQueue(operation);

        // Return optimistic response
        return { id: operation.entityId, ...data };
      }
      throw error;
    }
  }

  async updateClient(id: string, data: any) {
    // Try to update online first
    try {
      return await this.db.updateClient(id, data);
    } catch (error) {
      // If offline, queue the operation
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'update',
          entityType: 'client',
          entityId: id,
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 1,
        };

        await this.syncManager.addToQueue(operation);

        // Return optimistic response
        return { id, ...data };
      }
      throw error;
    }
  }

  async deleteClient(id: string) {
    // Try to delete online first
    try {
      return await this.db.deleteClient(id);
    } catch (error) {
      // If offline, queue the operation
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'delete',
          entityType: 'client',
          entityId: id,
          payload: {},
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 1,
        };

        await this.syncManager.addToQueue(operation);
        return;
      }
      throw error;
    }
  }

  // ============================================================================
  // STAFF OPERATIONS
  // ============================================================================

  async createStaff(data: any) {
    try {
      return await this.db.createStaff(data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: 'staff',
          entityId: uuidv4(),
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 1,
        };

        await this.syncManager.addToQueue(operation);
        return { id: operation.entityId, ...data };
      }
      throw error;
    }
  }

  async updateStaff(id: string, data: any) {
    try {
      return await this.db.updateStaff(id, data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'update',
          entityType: 'staff',
          entityId: id,
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 1,
        };

        await this.syncManager.addToQueue(operation);
        return { id, ...data };
      }
      throw error;
    }
  }

  async deleteStaff(id: string) {
    try {
      return await this.db.deleteStaff(id);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'delete',
          entityType: 'staff',
          entityId: id,
          payload: {},
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 1,
        };

        await this.syncManager.addToQueue(operation);
        return;
      }
      throw error;
    }
  }

  // ============================================================================
  // EVENT OPERATIONS
  // ============================================================================

  async createEvent(data: any) {
    try {
      return await this.db.createEvent(data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: 'event',
          entityId: uuidv4(),
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 2, // Higher priority for events
        };

        await this.syncManager.addToQueue(operation);
        return { id: operation.entityId, ...data };
      }
      throw error;
    }
  }

  async updateEvent(id: string, data: any) {
    try {
      return await this.db.updateEvent(id, data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'update',
          entityType: 'event',
          entityId: id,
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 2,
        };

        await this.syncManager.addToQueue(operation);
        return { id, ...data };
      }
      throw error;
    }
  }

  async deleteEvent(id: string) {
    try {
      return await this.db.deleteEvent(id);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'delete',
          entityType: 'event',
          entityId: id,
          payload: {},
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 2,
        };

        await this.syncManager.addToQueue(operation);
        return;
      }
      throw error;
    }
  }

  // ============================================================================
  // INVOICE OPERATIONS
  // ============================================================================

  async createInvoice(data: any) {
    try {
      return await this.db.createInvoice(data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: 'invoice',
          entityId: uuidv4(),
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 2,
        };

        await this.syncManager.addToQueue(operation);
        return { id: operation.entityId, ...data };
      }
      throw error;
    }
  }

  async updateInvoice(id: string, data: any) {
    try {
      return await this.db.updateInvoice(id, data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'update',
          entityType: 'invoice',
          entityId: id,
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 2,
        };

        await this.syncManager.addToQueue(operation);
        return { id, ...data };
      }
      throw error;
    }
  }

  // ============================================================================
  // PASS-THROUGH METHODS
  // ============================================================================

  async getClients(limit?: number, offset?: number) {
    return this.db.getClients(limit, offset);
  }

  async getClientById(id: string) {
    return this.db.getClientById(id);
  }

  async getStaff(limit?: number, offset?: number) {
    return this.db.getStaff(limit, offset);
  }

  async getStaffById(id: string) {
    return this.db.getStaffById(id);
  }

  async getEvents(filters?: any) {
    return this.db.getEvents(filters);
  }

  async getEventById(id: string) {
    return this.db.getEventById(id);
  }

  async getEventStaff(eventId: string) {
    return this.db.getEventStaff(eventId);
  }

  async assignStaffToEvent(staffId: string, eventId: string) {
    try {
      return await this.db.assignStaffToEvent(staffId, eventId);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: 'assignment',
          entityId: uuidv4(),
          payload: { staffId, eventId },
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 2,
        };

        await this.syncManager.addToQueue(operation);
        return { id: operation.entityId, staff_id: staffId, event_id: eventId };
      }
      throw error;
    }
  }

  async getInvoices(filters?: any) {
    return this.db.getInvoices(filters);
  }

  async getInvoiceById(id: string) {
    return this.db.getInvoiceById(id);
  }

  async getInventory(limit?: number, offset?: number) {
    return this.db.getInventory(limit, offset);
  }

  async createInventoryItem(data: any) {
    try {
      return await this.db.createInventoryItem(data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'create',
          entityType: 'inventory',
          entityId: uuidv4(),
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 0,
        };

        await this.syncManager.addToQueue(operation);
        return { id: operation.entityId, ...data };
      }
      throw error;
    }
  }

  async updateInventoryItem(id: string, data: any) {
    try {
      return await this.db.updateInventoryItem(id, data);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'update',
          entityType: 'inventory',
          entityId: id,
          payload: data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 0,
        };

        await this.syncManager.addToQueue(operation);
        return { id, ...data };
      }
      throw error;
    }
  }

  async deleteInventoryItem(id: string) {
    try {
      return await this.db.deleteInventoryItem(id);
    } catch (error) {
      if (!this.syncManager.isOnlineStatus()) {
        const operation: OfflineQueueTypes.QueuedOperation = {
          id: uuidv4(),
          type: 'delete',
          entityType: 'inventory',
          entityId: id,
          payload: {},
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          priority: 0,
        };

        await this.syncManager.addToQueue(operation);
        return;
      }
      throw error;
    }
  }

  // ============================================================================
  // SYNC MANAGER ACCESS
  // ============================================================================

  getSyncManager(): OfflineSyncManager {
    return this.syncManager;
  }

  async getSyncStatus() {
    return this.syncManager.getStatusAsync();
  }

  async manualSync() {
    return this.syncManager.sync();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let wrapperInstance: OfflineDatabaseWrapper | null = null;

export function getOfflineDatabaseWrapper(
  supabase: SupabaseClient,
  db: CateringDatabase
): OfflineDatabaseWrapper {
  if (!wrapperInstance) {
    wrapperInstance = new OfflineDatabaseWrapper(supabase, db);
  }
  return wrapperInstance;
}

export function resetOfflineDatabaseWrapper(): void {
  wrapperInstance = null;
}
