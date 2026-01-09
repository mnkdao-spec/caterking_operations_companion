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

// Clients (from events, we'll need to create a clients table)
export async function getClients() {
  // For now, return empty array until we create a proper clients table
  // TODO: Create clients table in migration
  return [];
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

// Staff (we'll need to create a staff table)
export async function getStaff() {
  // TODO: Create staff table in migration
  return [];
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
  
  return {
    totalRevenue: totalGuests * 50, // Rough estimate
    activeEvents: activeEventsCount || 0,
    totalClients: 0, // TODO: implement when clients table exists
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
