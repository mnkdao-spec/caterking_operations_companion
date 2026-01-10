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
  
  const totalGuests = events?.reduce((sum, e) => sum + (e.total_guests || 0), 0) || 0;
  
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
