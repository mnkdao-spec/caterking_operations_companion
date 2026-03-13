/**
 * Unified Supabase service layer for mobile and web apps
 * Provides consistent API for database operations across platforms
 */

import { SupabaseClient } from '@supabase/supabase-js';
import * as DatabaseTypes from './database-types';

export class CateringDatabase {
  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // CLIENTS
  // ============================================================================

  async getClients(limit = 100, offset = 0, search?: string) {
    let query = this.supabase
      .from('clients')
      .select('*');

    if (search) {
      query = query.ilike('client_name', `%${search}%`);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('client_name', { ascending: true });

    if (error) throw error;
    return data as DatabaseTypes.Client[];
  }

  async getClientById(id: string) {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Client;
  }

  async createClient(client: Omit<DatabaseTypes.Client, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Client;
  }

  async updateClient(id: string, updates: Partial<DatabaseTypes.Client>) {
    const { data, error } = await this.supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Client;
  }

  async deleteClient(id: string) {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // STAFF
  // ============================================================================

  async getStaff(limit = 100, offset = 0, search?: string) {
    let query = this.supabase
      .from('staff')
      .select('*');

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data as DatabaseTypes.Staff[];
  }

  async getStaffById(id: string) {
    const { data, error } = await this.supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Staff;
  }

  async createStaff(staff: Omit<DatabaseTypes.Staff, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('staff')
      .insert([staff])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Staff;
  }

  async updateStaff(id: string, updates: Partial<DatabaseTypes.Staff>) {
    const { data, error } = await this.supabase
      .from('staff')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Staff;
  }

  async deleteStaff(id: string) {
    const { error } = await this.supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  async getEvents(filters?: DatabaseTypes.EventFilters & { search?: string }) {
    let query = this.supabase.from('events').select('*');

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.startDate) {
      query = query.gte('event_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('event_date', filters.endDate);
    }
    if (filters?.search) {
      query = query.ilike('event_name', `%${filters.search}%`);
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data as DatabaseTypes.Event[];
  }

  async getEventById(id: string) {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Event;
  }

  async createEvent(event: Omit<DatabaseTypes.Event, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Event;
  }

  async updateEvent(id: string, updates: Partial<DatabaseTypes.Event>) {
    const { data, error } = await this.supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Event;
  }

  async deleteEvent(id: string) {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // STAFF ASSIGNMENTS
  // ============================================================================

  async getEventStaff(eventId: string) {
    const { data, error } = await this.supabase
      .from('staff_assignments')
      .select('staff_id, staff:staff_id(*)')
      .eq('event_id', eventId);

    if (error) throw error;
    return data as any[];
  }

  async assignStaffToEvent(staffId: string, eventId: string) {
    const { data, error } = await this.supabase
      .from('staff_assignments')
      .insert([{ staff_id: staffId, event_id: eventId }])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.StaffAssignment;
  }

  async removeStaffFromEvent(staffId: string, eventId: string) {
    const { error } = await this.supabase
      .from('staff_assignments')
      .delete()
      .eq('staff_id', staffId)
      .eq('event_id', eventId);

    if (error) throw error;
  }

  // ============================================================================
  // INVOICES
  // ============================================================================

  async getInvoices(filters?: DatabaseTypes.InvoiceFilters & { search?: string }) {
    let query = this.supabase.from('invoices').select('*');

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('invoice_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('invoice_date', filters.endDate);
    }
    if (filters?.search) {
      query = query.ilike('invoice_number', `%${filters.search}%`);
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return data as DatabaseTypes.Invoice[];
  }

  async getInvoiceById(id: string) {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as any;
  }

  async createInvoice(invoice: Omit<DatabaseTypes.Invoice, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('invoices')
      .insert([invoice])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Invoice;
  }

  async updateInvoice(id: string, updates: Partial<DatabaseTypes.Invoice>) {
    const { data, error } = await this.supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.Invoice;
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribeToEvents(callback: (payload: any) => void) {
    return this.supabase
      .channel('events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
      .subscribe();
  }

  subscribeToStaffAssignments(callback: (payload: any) => void) {
    return this.supabase
      .channel('staff_assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_assignments' }, callback)
      .subscribe();
  }

  subscribeToInvoices(callback: (payload: any) => void) {
    return this.supabase
      .channel('invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, callback)
      .subscribe();
  }

  subscribeToEventStaff(eventId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`event_staff_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_assignments',
          filter: `event_id=eq.${eventId}`,
        },
        callback
      )
      .subscribe();
  }

  // ============================================================================
  // INVENTORY
  // ============================================================================

  async getInventory(limit = 100, offset = 0) {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DatabaseTypes.InventoryItem[];
  }

  async updateInventory(id: string, quantity: number) {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .update({ quantity, last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.InventoryItem;
  }

  async logInventoryChange(
    itemId: string,
    quantityChange: number,
    reason: string,
    userId?: string
  ) {
    const { data, error } = await this.supabase
      .from('inventory_logs')
      .insert([{ inventory_item_id: itemId, quantity_change: quantityChange, reason, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.InventoryLog;
  }

  // ============================================================================
  // AVAILABILITY
  // ============================================================================

  async getStaffAvailability(staffId: string) {
    const { data, error } = await this.supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staffId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data as DatabaseTypes.StaffAvailability[];
  }

  async addStaffAvailability(
    availability: Omit<DatabaseTypes.StaffAvailability, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await this.supabase
      .from('staff_availability')
      .insert([availability])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.StaffAvailability;
  }

  async removeStaffAvailability(id: string) {
    const { error } = await this.supabase
      .from('staff_availability')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // KDS (KITCHEN DISPLAY SYSTEM)
  // ============================================================================

  async getFiredCourses(eventId: string) {
    const { data, error } = await this.supabase
      .from('fired_courses')
      .select('*')
      .eq('event_id', eventId)
      .order('fired_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createFiredCourse(firedCourse: any) {
    const { data, error } = await this.supabase
      .from('fired_courses')
      .insert([firedCourse])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFiredCourse(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('fired_courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrderItems(firedCourseId: string) {
    const { data, error } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('fired_course_id', firedCourseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createOrderItem(orderItem: any) {
    const { data, error } = await this.supabase
      .from('order_items')
      .insert([orderItem])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOrderItem(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('order_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // PROCUREMENT & PAYABLES
  // ============================================================================

  async getPurchaseOrders(limit = 100, offset = 0) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getPurchaseOrderById(id: string) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*, po_items(*), suppliers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createPurchaseOrder(po: Omit<DatabaseTypes.PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .insert([po])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.PurchaseOrder;
  }

  async updatePurchaseOrder(id: string, updates: Partial<DatabaseTypes.PurchaseOrder>) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.PurchaseOrder;
  }

  async deletePurchaseOrder(id: string) {
    const { error } = await this.supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createPOItem(item: Omit<DatabaseTypes.POItem, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase
      .from('po_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.POItem;
  }

  async getPOItems(poId: string) {
    const { data, error } = await this.supabase
      .from('po_items')
      .select('*')
      .eq('po_id', poId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DatabaseTypes.POItem[];
  }

  async updatePOItem(id: string, updates: Partial<DatabaseTypes.POItem>) {
    const { data, error } = await this.supabase
      .from('po_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.POItem;
  }

  async deletePOItem(id: string) {
    const { error } = await this.supabase
      .from('po_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async logOCRAudit(log: Omit<DatabaseTypes.OCRAuditLog, 'id' | 'processed_at'>) {
    const { data, error } = await this.supabase
      .from('ocr_audit_logs')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTypes.OCRAuditLog;
  }

  // ============================================================================
  // STAFF SHIFTS & PAYROLL
  // ============================================================================

  async getStaffShifts(staffId?: string, eventId?: string) {
    let query = this.supabase.from('staff_shifts').select('*, staff:staff_id(*), events:event_id(*)');
    if (staffId) query = query.eq('staff_id', staffId);
    if (eventId) query = query.eq('event_id', eventId);
    
    const { data, error } = await query.order('clock_in', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createStaffShift(shift: any) {
    const { data, error } = await this.supabase
      .from('staff_shifts')
      .insert([shift])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateStaffShift(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('staff_shifts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Factory function to create a CateringDatabase instance
 */
export function createCateringDatabase(supabase: SupabaseClient): CateringDatabase {
  return new CateringDatabase(supabase);
}
