/**
 * React hooks for accessing the unified catering database
 * Can be used in both mobile and web apps
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CateringDatabase } from './supabase-service';
import * as DatabaseTypes from './database-types';

// ============================================================================
// CLIENTS HOOKS
// ============================================================================

export function useClients(limit = 100, offset = 0) {
  const [clients, setClients] = useState<DatabaseTypes.Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  const fetchClients = useCallback(async () => {
    if (!db.current) return;

    try {
      setIsLoading(true);
      const data = await db.current.getClients(limit, offset);
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch clients'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, isLoading, error, refetch: fetchClients };
}

export function useClientById(id: string) {
  const [client, setClient] = useState<DatabaseTypes.Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  useEffect(() => {
    if (!id || !db.current) return;

    const fetchClient = async () => {
      try {
        setIsLoading(true);
        const data = await db.current!.getClientById(id);
        setClient(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch client'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  return { client, isLoading, error };
}

// ============================================================================
// EVENTS HOOKS
// ============================================================================

export function useEvents(filters?: DatabaseTypes.EventFilters) {
  const [events, setEvents] = useState<DatabaseTypes.Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!db.current) return;

    try {
      setIsLoading(true);
      const data = await db.current.getEvents(filters);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();

    // Subscribe to real-time updates
    if (db.current) {
      subscriptionRef.current = db.current.subscribeToEvents((payload) => {
        console.log('[Events] Real-time update:', payload);
        fetchEvents(); // Refetch on changes
      });
    }

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

export function useEventById(id: string) {
  const [event, setEvent] = useState<DatabaseTypes.Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  useEffect(() => {
    if (!id || !db.current) return;

    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const data = await db.current!.getEventById(id);
        setEvent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch event'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  return { event, isLoading, error };
}

// ============================================================================
// STAFF HOOKS
// ============================================================================

export function useStaff(limit = 100, offset = 0) {
  const [staff, setStaff] = useState<DatabaseTypes.Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!db.current) return;

    try {
      setIsLoading(true);
      const data = await db.current.getStaff(limit, offset);
      setStaff(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch staff'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return { staff, isLoading, error, refetch: fetchStaff };
}

// ============================================================================
// STAFF ASSIGNMENTS HOOKS
// ============================================================================

export function useEventStaff(eventId: string) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const fetchEventStaff = useCallback(async () => {
    if (!eventId || !db.current) return;

    try {
      setIsLoading(true);
      const data = await db.current.getEventStaff(eventId);
      setStaffList(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch event staff'));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventStaff();

    // Subscribe to real-time updates for this event
    if (db.current && eventId) {
      subscriptionRef.current = db.current.subscribeToEventStaff(eventId, (payload) => {
        console.log('[Staff Assignments] Real-time update:', payload);
        fetchEventStaff();
      });
    }

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [eventId, fetchEventStaff]);

  return { staffList, isLoading, error, refetch: fetchEventStaff };
}

// ============================================================================
// INVOICES HOOKS
// ============================================================================

export function useInvoices(filters?: DatabaseTypes.InvoiceFilters) {
  const [invoices, setInvoices] = useState<DatabaseTypes.Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!db.current) return;

    try {
      setIsLoading(true);
      const data = await db.current.getInvoices(filters);
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch invoices'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();

    // Subscribe to real-time updates
    if (db.current) {
      subscriptionRef.current = db.current.subscribeToInvoices((payload) => {
        console.log('[Invoices] Real-time update:', payload);
        fetchInvoices();
      });
    }

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [fetchInvoices]);

  return { invoices, isLoading, error, refetch: fetchInvoices };
}

// ============================================================================
// INVENTORY HOOKS
// ============================================================================

export function useInventory(limit = 100, offset = 0) {
  const [inventory, setInventory] = useState<DatabaseTypes.InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!db.current) return;

    try {
      setIsLoading(true);
      const data = await db.current.getInventory(limit, offset);
      setInventory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return { inventory, isLoading, error, refetch: fetchInventory };
}

// ============================================================================
// MUTATIONS HOOKS
// ============================================================================

export function useCreateEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  const createEvent = useCallback(
    async (event: Omit<DatabaseTypes.Event, 'id' | 'created_at' | 'updated_at'>) => {
      if (!db.current) throw new Error('Database not initialized');

      try {
        setIsLoading(true);
        const newEvent = await db.current.createEvent(event);
        setError(null);
        return newEvent;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create event');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createEvent, isLoading, error };
}

export function useUpdateEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  const updateEvent = useCallback(
    async (id: string, updates: Partial<DatabaseTypes.Event>) => {
      if (!db.current) throw new Error('Database not initialized');

      try {
        setIsLoading(true);
        const updatedEvent = await db.current.updateEvent(id, updates);
        setError(null);
        return updatedEvent;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update event');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { updateEvent, isLoading, error };
}

export function useAssignStaffToEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useRef<CateringDatabase | null>(null);

  const assignStaff = useCallback(
    async (staffId: string, eventId: string) => {
      if (!db.current) throw new Error('Database not initialized');

      try {
        setIsLoading(true);
        const assignment = await db.current.assignStaffToEvent(staffId, eventId);
        setError(null);
        return assignment;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to assign staff');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { assignStaff, isLoading, error };
}
