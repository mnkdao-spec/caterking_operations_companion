import { supabase } from "./supabase-kds";

// Types
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  category: string;
  cost_per_unit: number;
  reorder_level: number;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export interface StockLevel {
  id: string;
  ingredient_id: string;
  event_id: string | null;
  quantity: number;
  last_updated: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  event_id: string | null;
  ingredient_id: string;
  transaction_type: "initial_stock" | "decrement" | "adjustment" | "restock";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  order_item_id?: string;
  created_by: string;
  created_at: string;
}

export interface LowStockAlert {
  id: string;
  event_id: string;
  ingredient_id: string;
  current_level: number;
  reorder_level: number;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

export interface InventoryStatus {
  ingredient_id: string;
  ingredient_name: string;
  current_quantity: number;
  unit: string;
  reorder_level: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  cost_value: number;
}

// Ingredients service
export const ingredientsService = {
  async getAll(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching ingredients:", error);
      return [];
    }
    return data || [];
  },

  async getById(id: string): Promise<Ingredient | null> {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching ingredient:", error);
      return null;
    }
    return data;
  },

  async create(ingredient: Omit<Ingredient, "id" | "created_at" | "updated_at">): Promise<Ingredient | null> {
    const { data, error } = await supabase
      .from("ingredients")
      .insert([ingredient])
      .select()
      .single();

    if (error) {
      console.error("Error creating ingredient:", error);
      return null;
    }
    return data;
  },

  async getByCategory(category: string): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("category", category)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching ingredients by category:", error);
      return [];
    }
    return data || [];
  },
};

// Stock levels service
export const stockLevelsService = {
  async getForEvent(eventId: string): Promise<StockLevel[]> {
    const { data, error } = await supabase
      .from("stock_levels")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      console.error("Error fetching stock levels:", error);
      return [];
    }
    return data || [];
  },

  async getForIngredient(ingredientId: string, eventId?: string): Promise<StockLevel | null> {
    let query = supabase
      .from("stock_levels")
      .select("*")
      .eq("ingredient_id", ingredientId);

    if (eventId) {
      query = query.eq("event_id", eventId);
    } else {
      query = query.is("event_id", null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching stock level:", error);
      return null;
    }
    return data || null;
  },

  async setInitialStock(ingredientId: string, quantity: number, eventId?: string): Promise<StockLevel | null> {
    const { data, error } = await supabase
      .from("stock_levels")
      .upsert([
        {
          ingredient_id: ingredientId,
          event_id: eventId || null,
          quantity,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error setting initial stock:", error);
      return null;
    }
    return data;
  },

  async adjustStock(
    ingredientId: string,
    quantityChange: number,
    reason: string,
    eventId?: string
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc("adjust_stock", {
      p_ingredient_id: ingredientId,
      p_quantity_change: quantityChange,
      p_reason: reason,
      p_event_id: eventId || null,
    });

    if (error) {
      console.error("Error adjusting stock:", error);
      return { success: false, message: error.message };
    }
    return { success: true, message: "Stock adjusted successfully" };
  },
};

// Recipe ingredients service
export const recipeIngredientsService = {
  async getForMenuItem(menuItemId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]> {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        *,
        ingredients (*)
      `
      )
      .eq("menu_item_id", menuItemId);

    if (error) {
      console.error("Error fetching recipe ingredients:", error);
      return [];
    }
    return data || [];
  },

  async addIngredientToRecipe(
    menuItemId: string,
    ingredientId: string,
    quantity: number
  ): Promise<RecipeIngredient | null> {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .insert([
        {
          menu_item_id: menuItemId,
          ingredient_id: ingredientId,
          quantity,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding ingredient to recipe:", error);
      return null;
    }
    return data;
  },

  async removeIngredientFromRecipe(recipeIngredientId: string): Promise<boolean> {
    const { error } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("id", recipeIngredientId);

    if (error) {
      console.error("Error removing ingredient from recipe:", error);
      return false;
    }
    return true;
  },
};

// Inventory transactions service
export const inventoryTransactionsService = {
  async getForEvent(eventId: string): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory transactions:", error);
      return [];
    }
    return data || [];
  },

  async getForIngredient(ingredientId: string, eventId?: string): Promise<InventoryTransaction[]> {
    let query = supabase
      .from("inventory_transactions")
      .select("*")
      .eq("ingredient_id", ingredientId);

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory transactions:", error);
      return [];
    }
    return data || [];
  },

  async getForOrderItem(orderItemId: string): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("*")
      .eq("order_item_id", orderItemId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions for order item:", error);
      return [];
    }
    return data || [];
  },
};

// Low stock alerts service
export const lowStockAlertsService = {
  async getForEvent(eventId: string, acknowledgedOnly: boolean = false): Promise<LowStockAlert[]> {
    let query = supabase
      .from("low_stock_alerts")
      .select("*")
      .eq("event_id", eventId);

    if (acknowledgedOnly) {
      query = query.eq("acknowledged", false);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching low stock alerts:", error);
      return [];
    }
    return data || [];
  },

  async acknowledgeAlert(alertId: string, userId: string): Promise<LowStockAlert | null> {
    const { data, error } = await supabase
      .from("low_stock_alerts")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq("id", alertId)
      .select()
      .single();

    if (error) {
      console.error("Error acknowledging alert:", error);
      return null;
    }
    return data;
  },

  async getUnacknowledgedCount(eventId: string): Promise<number> {
    const { count, error } = await supabase
      .from("low_stock_alerts")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("acknowledged", false);

    if (error) {
      console.error("Error counting unacknowledged alerts:", error);
      return 0;
    }
    return count || 0;
  },
};

// Inventory status service
export const inventoryStatusService = {
  async getEventInventoryStatus(eventId: string): Promise<InventoryStatus[]> {
    const { data, error } = await supabase.rpc("get_inventory_status", {
      p_event_id: eventId,
    });

    if (error) {
      console.error("Error fetching inventory status:", error);
      return [];
    }
    return data || [];
  },

  async getInventoryValue(eventId: string): Promise<number> {
    const status = await this.getEventInventoryStatus(eventId);
    return status.reduce((total, item) => total + item.cost_value, 0);
  },

  async getLowStockItems(eventId: string): Promise<InventoryStatus[]> {
    const status = await this.getEventInventoryStatus(eventId);
    return status.filter((item) => item.status === "low_stock" || item.status === "out_of_stock");
  },
};

// Main decrement function (called when an order item is bumped)
export async function decrementInventoryForOrderItem(
  eventId: string,
  menuItemId: string,
  orderItemId: string,
  quantity: number = 1
): Promise<{ success: boolean; message: string; alertsCreated: number }> {
  try {
    const { data, error } = await supabase.rpc("decrement_stock", {
      p_event_id: eventId,
      p_menu_item_id: menuItemId,
      p_order_item_id: orderItemId,
      p_quantity: quantity,
    });

    if (error) {
      console.error("Error decrementing stock:", error);
      return { success: false, message: error.message, alertsCreated: 0 };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        message: result.message,
        alertsCreated: result.low_stock_alerts_created || 0,
      };
    }

    return { success: false, message: "Unknown error", alertsCreated: 0 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to decrement inventory";
    console.error("Exception during inventory decrement:", error);
    return { success: false, message: errorMessage, alertsCreated: 0 };
  }
}

// Realtime subscriptions for inventory
export const inventoryRealtimeSubscriptions = {
  subscribeToLowStockAlerts(eventId: string, callback: (alert: LowStockAlert) => void) {
    const subscription = supabase
      .channel(`low_stock:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "low_stock_alerts",
          filter: `event_id=eq.${eventId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeToStockLevelChanges(eventId: string, callback: (level: StockLevel) => void) {
    const subscription = supabase
      .channel(`stock_changes:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stock_levels",
          filter: `event_id=eq.${eventId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
};
