import { supabase } from "./supabase";

// Events
export async function getEvents() {
  const { data, error } = await supabase
    .from("kds_events")
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
    .from("kds_events")
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
    .from("kds_menu_items")
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
    .from("kds_events")
    .select("total_guests");
  
  const totalGuests = events?.reduce((sum, e) => sum + (e.total_guests || 0), 0) || 0;
  
  // Get active events count
  const { count: activeEventsCount } = await supabase
    .from("kds_events")
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
      { event: "*", schema: "public", table: "kds_events" },
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
