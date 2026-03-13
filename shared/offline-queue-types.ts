/**
 * Offline Queue Types
 * Defines data structures for persisting operations when offline
 */

// ============================================================================
// OPERATION TYPES
// ============================================================================

export type OperationType = 'create' | 'update' | 'delete' | 'custom';
export type EntityType = 'client' | 'staff' | 'event' | 'invoice' | 'inventory' | 'assignment' | 'fired_course' | 'order_item';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

// ============================================================================
// QUEUE OPERATION
// ============================================================================

export interface QueuedOperation {
  // Unique identifier for this operation
  id: string;

  // Operation metadata
  type: OperationType;
  entityType: EntityType;
  entityId: string;

  // Operation data
  payload: Record<string, any>;
  timestamp: number;

  // Sync status
  status: SyncStatus;
  retryCount: number;
  lastError?: string;

  // Conflict resolution
  conflictResolution?: 'overwrite' | 'merge' | 'skip' | 'manual';
  conflictData?: Record<string, any>;

  // Metadata
  userId?: string;
  deviceId?: string;
  priority?: number; // 0 = low, 1 = normal, 2 = high
}

// ============================================================================
// BATCH OPERATION
// ============================================================================

export interface BatchOperation {
  id: string;
  operations: QueuedOperation[];
  status: SyncStatus;
  createdAt: number;
  syncedAt?: number;
  error?: string;
}

// ============================================================================
// SYNC RESULT
// ============================================================================

export interface SyncResult {
  success: boolean;
  operationId: string;
  entityId: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  serverData?: Record<string, any>;
  conflict?: {
    local: Record<string, any>;
    remote: Record<string, any>;
  };
}

// ============================================================================
// OFFLINE QUEUE STATE
// ============================================================================

export interface OfflineQueueState {
  // Queue operations
  operations: QueuedOperation[];

  // Connection status
  isOnline: boolean;
  lastOnlineTime?: number;
  lastSyncTime?: number;

  // Sync statistics
  totalOperations: number;
  pendingOperations: number;
  failedOperations: number;
  syncedOperations: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// SYNC OPTIONS
// ============================================================================

export interface SyncOptions {
  // Sync behavior
  batchSize?: number; // Number of operations to sync at once
  maxRetries?: number; // Maximum retry attempts
  retryDelay?: number; // Delay between retries in ms
  timeout?: number; // Operation timeout in ms

  // Conflict handling
  conflictStrategy?: 'overwrite' | 'merge' | 'skip' | 'manual';
  preserveLocalChanges?: boolean;

  // Filtering
  entityTypes?: EntityType[];
  statuses?: SyncStatus[];
  minPriority?: number;
}

// ============================================================================
// OFFLINE QUEUE EVENTS
// ============================================================================

export type OfflineQueueEventType =
  | 'operation_added'
  | 'operation_synced'
  | 'operation_failed'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'conflict_detected'
  | 'connection_changed'
  | 'queue_cleared';

export interface OfflineQueueEvent {
  type: OfflineQueueEventType;
  timestamp: number;
  data?: any;
}

// ============================================================================
// OFFLINE QUEUE LISTENER
// ============================================================================

export type OfflineQueueListener = (event: OfflineQueueEvent) => void;

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

export interface OperationHandler {
  handle(operation: QueuedOperation): Promise<SyncResult>;
  canHandle(operation: QueuedOperation): boolean;
}

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export interface OfflineQueueStorage {
  // Read operations
  getQueue(): Promise<OfflineQueueState>;
  getOperation(id: string): Promise<QueuedOperation | null>;
  getOperations(filter?: Partial<QueuedOperation>): Promise<QueuedOperation[]>;

  // Write operations
  addOperation(operation: QueuedOperation): Promise<void>;
  updateOperation(id: string, updates: Partial<QueuedOperation>): Promise<void>;
  removeOperation(id: string): Promise<void>;
  clearQueue(): Promise<void>;

  // Batch operations
  addOperations(operations: QueuedOperation[]): Promise<void>;
  updateOperations(updates: Array<{ id: string; data: Partial<QueuedOperation> }>): Promise<void>;

  // State management
  setState(state: Partial<OfflineQueueState>): Promise<void>;
  getState(): Promise<OfflineQueueState>;
}

// ============================================================================
// SYNC MANAGER INTERFACE
// ============================================================================

export interface SyncManager {
  // Sync operations
  sync(options?: SyncOptions): Promise<SyncResult[]>;
  syncOperation(operationId: string): Promise<SyncResult>;
  syncBatch(operationIds: string[]): Promise<SyncResult[]>;

  // Queue management
  addToQueue(operation: QueuedOperation): Promise<void>;
  removeFromQueue(operationId: string): Promise<void>;
  clearQueue(): Promise<void>;

  // Status
  getStatus(): OfflineQueueState;
  getPendingOperations(): QueuedOperation[];
  getFailedOperations(): QueuedOperation[];

  // Events
  on(event: OfflineQueueEventType, listener: OfflineQueueListener): void;
  off(event: OfflineQueueEventType, listener: OfflineQueueListener): void;

  // Connection
  isOnline(): boolean;
  setOnline(online: boolean): void;
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

export interface ConflictResolution {
  strategy: 'overwrite' | 'merge' | 'skip' | 'manual';
  local: Record<string, any>;
  remote: Record<string, any>;
  resolved?: Record<string, any>;
}

export interface ConflictResolver {
  resolve(conflict: ConflictResolution): Promise<Record<string, any>>;
}