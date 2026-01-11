import { supabase } from "./supabase";

// Events
export async function getEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });
  
  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }
  return data || [];
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }
  return data;
}

// Menu Items
export async function getMenuItems() {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
  return data || [];
}

// Clients
export async function getClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
  return data || [];
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching client:", error);
    return null;
  }
  return data;
}

// Inventory
export async function getInventoryItems() {
  const { data, error } = await supabase
    .from("inventory_items")
    .select(`
      *,
      stock_levels (
        current_quantity,
        min_quantity,
        last_updated
      )
    `)
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
  return data || [];
}

export async function getStockLevels() {
  const { data, error } = await supabase
    .from("inventory_stock_levels")
    .select(`
      *,
      item:inventory_items (
        name,
        unit,
        category
      )
    `);
  
  if (error) {
    console.error("Error fetching stock levels:", error);
    return [];
  }
  return data || [];
}

export async function getLowStockAlerts() {
  const { data, error } = await supabase
    .from("inventory_low_stock_alerts")
    .select(`
      *,
      item:inventory_items (
        name,
        unit,
        category
      )
    `)
    .eq("resolved", false)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching low stock alerts:", error);
    return [];
  }
  return data || [];
}

// Staff
export async function getStaff() {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .order("last_name", { ascending: true });
  
  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
  return data || [];
}

export async function getStaffById(id: string) {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching staff:", error);
    return null;
  }
  return data;
}

export async function getStaffAssignments(staffId?: string) {
  let query = supabase
    .from("staff_assignments")
    .select(`
      *,
      staff:staff (
        first_name,
        last_name,
        role
      )
    `);
  
  if (staffId) {
    query = query.eq("staff_id", staffId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching staff assignments:", error);
    return [];
  }
  return data || [];
}

// Dashboard Stats
export async function getDashboardStats() {
  // Get total revenue from events
  const { data: events } = await supabase
    .from("events")
    .select("total_guests");
  
  const totalGuests = events?.reduce((sum: number, e: any) => sum + (e.total_guests || 0), 0) || 0;
  
  // Get active events count
  const { count: activeEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .gte("event_date", new Date().toISOString());
  
  // Get low stock alerts count
  const { count: lowStockCount } = await supabase
    .from("inventory_low_stock_alerts")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false);
  
  // Get total clients count
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  
  return {
    totalRevenue: totalGuests * 50, // Rough estimate
    activeEvents: activeEventsCount || 0,
    totalClients: clientsCount || 0,
    inventoryAlerts: lowStockCount || 0,
  };
}

// Real-time subscriptions
export function subscribeToEvents(callback: (payload: any) => void) {
  const channel = supabase
    .channel("events-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events" },
      callback
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToInventory(callback: (payload: any) => void) {
  const channel = supabase
    .channel("inventory-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inventory_stock_levels" },
      callback
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}


// ========== CREATE/UPDATE/DELETE OPERATIONS ==========

// Clients CRUD
export async function createClient(clientData: any) {
  const { data, error } = await supabase
    .from("clients")
    .insert([clientData])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating client:", error);
    throw error;
  }
  return data;
}

export async function updateClient(id: string, clientData: any) {
  const { data, error } = await supabase
    .from("clients")
    .update(clientData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating client:", error);
    throw error;
  }
  return data;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
}

// Staff CRUD
export async function createStaff(staffData: any) {
  const { data, error } = await supabase
    .from("staff")
    .insert([staffData])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating staff:", error);
    throw error;
  }
  return data;
}

export async function updateStaff(id: string, staffData: any) {
  const { data, error } = await supabase
    .from("staff")
    .update(staffData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating staff:", error);
    throw error;
  }
  return data;
}

export async function deleteStaff(id: string) {
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting staff:", error);
    throw error;
  }
}

// Events CRUD
export async function createEvent(eventData: any) {
  const { data, error } = await supabase
    .from("events")
    .insert([eventData])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating event:", error);
    throw error;
  }
  return data;
}

export async function updateEvent(id: string, eventData: any) {
  const { data, error } = await supabase
    .from("events")
    .update(eventData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating event:", error);
    throw error;
  }
  return data;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

// Menu Items CRUD
export async function createMenuItem(menuData: any) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert([menuData])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating menu item:", error);
    throw error;
  }
  return data;
}

export async function updateMenuItem(id: string, menuData: any) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(menuData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating menu item:", error);
    throw error;
  }
  return data;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting menu item:", error);
    throw error;
  }
}


export async function createStaffAssignment(assignment: {
  staff_id: string;
  event_id: string;
  role: string;
  hours_worked?: number;
  pay_amount?: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("staff_assignments")
    .insert([assignment])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating staff assignment:", error);
    throw error;
  }
  return data;
}

export async function updateStaffAssignment(id: string, updates: {
  role?: string;
  hours_worked?: number;
  pay_amount?: number;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("staff_assignments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating staff assignment:", error);
    throw error;
  }
  return data;
}

export async function deleteStaffAssignment(id: string) {
  const { error } = await supabase
    .from("staff_assignments")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting staff assignment:", error);
    throw error;
  }
}


// ============================================================================
// STAFF AVAILABILITY & CONFLICT DETECTION
// ============================================================================

export interface StaffConflict {
  conflict_type: 'availability' | 'double_booking';
  conflict_start: string;
  conflict_end: string;
  conflict_details: string;
}

export async function checkStaffConflicts(
  staffId: string,
  eventId: string | null,
  eventDate: string,
  eventTime: string
): Promise<StaffConflict[]> {
  console.log('Checking staff conflicts with params:', {
    p_staff_id: staffId,
    p_event_id: eventId,
    p_event_date: eventDate,
    p_event_time: eventTime
  });
  
  const { data, error } = await supabase.rpc('check_staff_conflicts', {
    p_staff_id: staffId,
    p_event_id: eventId,
    p_event_date: eventDate,
    p_event_time: eventTime
  });
  
  if (error) {
    console.error("Error checking staff conflicts:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    return [];
  }
  
  return data || [];
}

export async function createStaffAvailability(availability: {
  staff_id: string;
  start_time: string;
  end_time: string;
  reason: 'time_off' | 'sick_day' | 'personal' | 'conflict' | 'other';
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("staff_availability")
    .insert([availability])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating staff availability:", error);
    throw error;
  }
  return data;
}

export async function getStaffAvailability(staffId: string) {
  const { data, error } = await supabase
    .from("staff_availability")
    .select("*")
    .eq("staff_id", staffId)
    .order("start_time", { ascending: true });
  
  if (error) {
    console.error("Error fetching staff availability:", error);
    return [];
  }
  return data || [];
}

export async function deleteStaffAvailability(id: string) {
  const { error } = await supabase
    .from("staff_availability")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting staff availability:", error);
    throw error;
  }
}


// Invoices
export interface Invoice {
  id: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  labor_costs_total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

// Recurring Invoice Templates
export interface InvoiceTemplate {
  id: string;
  client_id: string;
  template_name: string;
  description?: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  next_generation_date: string;
  last_generated_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplateItem {
  id: string;
  template_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  item_type: 'service' | 'labor' | 'menu_item' | 'charge';
  created_at: string;
  updated_at: string;
}

export async function getInvoiceTemplates() {
  const { data, error } = await supabase
    .from("invoice_templates")
    .select("*")
    .order("template_name", { ascending: true });
  
  if (error) {
    console.error("Error fetching invoice templates:", error);
    return [];
  }
  return data || [];
}

export async function getInvoiceTemplateById(id: string) {
  const { data, error } = await supabase
    .from("invoice_templates")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching invoice template:", error);
    return null;
  }
  return data;
}

export async function getInvoiceTemplatesByClient(clientId: string) {
  const { data, error } = await supabase
    .from("invoice_templates")
    .select("*")
    .eq("client_id", clientId)
    .order("template_name", { ascending: true });
  
  if (error) {
    console.error("Error fetching client invoice templates:", error);
    return [];
  }
  return data || [];
}

export async function createInvoiceTemplate(template: {
  client_id: string;
  template_name: string;
  description?: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  next_generation_date: string;
  is_active: boolean;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("invoice_templates")
    .insert([template])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating invoice template:", error);
    throw error;
  }
  return data;
}

export async function updateInvoiceTemplate(
  id: string,
  updates: Partial<InvoiceTemplate>
) {
  const { data, error } = await supabase
    .from("invoice_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating invoice template:", error);
    throw error;
  }
  return data;
}

export async function deleteInvoiceTemplate(id: string) {
  const { error } = await supabase
    .from("invoice_templates")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting invoice template:", error);
    throw error;
  }
}

export async function getInvoiceTemplateItems(templateId: string) {
  const { data, error } = await supabase
    .from("invoice_template_items")
    .select("*")
    .eq("template_id", templateId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Error fetching template items:", error);
    return [];
  }
  return data || [];
}

export async function createInvoiceTemplateItem(item: {
  template_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  item_type: 'service' | 'labor' | 'menu_item' | 'charge';
}) {
  const { data, error } = await supabase
    .from("invoice_template_items")
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating template item:", error);
    throw error;
  }
  return data;
}

export async function updateInvoiceTemplateItem(
  id: string,
  updates: Partial<InvoiceTemplateItem>
) {
  const { data, error } = await supabase
    .from("invoice_template_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating template item:", error);
    throw error;
  }
  return data;
}

export async function deleteInvoiceTemplateItem(id: string) {
  const { error } = await supabase
    .from("invoice_template_items")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting template item:", error);
    throw error;
  }
}

export async function generateInvoicesFromTemplates() {
  const { data, error } = await supabase
    .rpc("generate_invoices_from_templates");
  
  if (error) {
    console.error("Error generating invoices from templates:", error);
    throw error;
  }
  return data || [];
}
