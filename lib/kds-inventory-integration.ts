/**
 * KDS Inventory Integration
 * 
 * This module integrates the new inventory transaction system with the KDS
 * (Kitchen Display System) to ensure proper inventory decrements when orders
 * are marked as done.
 * 
 * Usage:
 * 1. When an order item is marked as "done", call handleOrderItemCompletion()
 * 2. The function will atomically decrement inventory with full rollback support
 * 3. If decrement fails, the order status is NOT updated (stays as "done" but inventory not decremented)
 * 4. Operators can manually retry or investigate the failure
 */

import { supabase } from "./supabase-client";
import {
  InventoryTransactionManager,
  decrementInventoryForOrderItemWithRollback,
  TransactionResult,
  TransactionStatus,
} from "./inventory-transaction-fix";

/**
 * Result of order item completion with inventory handling
 */
export interface OrderCompletionResult {
  success: boolean;
  orderItemId: string;
  inventoryResult: TransactionResult;
  message: string;
}

/**
 * Handle order item completion with inventory decrement
 * 
 * This function should be called when an operator marks an order item as "done"
 * in the KDS. It:
 * 
 * 1. Marks the order item as done
 * 2. Attempts to decrement inventory
 * 3. If inventory decrement fails, reverts the order status back to "cooking"
 * 4. Returns detailed result for UI feedback
 * 
 * @param orderItemId - The order item ID to complete
 * @param eventId - The event ID for inventory tracking
 * @param menuItemId - The menu item ID to get recipe ingredients
 * @returns Result with success status and inventory transaction details
 */
export async function handleOrderItemCompletion(
  orderItemId: string,
  eventId: string,
  menuItemId: string,
  quantity: number = 1
): Promise<OrderCompletionResult> {
  try {
    // Step 1: Mark order item as done
    const { error: updateError } = await supabase
      .from("order_items")
      .update({
        status: "done",
        bumped_at: new Date().toISOString(),
      })
      .eq("id", orderItemId);

    if (updateError) {
      return {
        success: false,
        orderItemId,
        inventoryResult: {
          success: false,
          transactionId: "",
          status: TransactionStatus.FAILED,
          message: "Failed to update order status",
          changes: 0,
          alertsCreated: 0,
          error: updateError.message,
        },
        message: `Failed to mark order as done: ${updateError.message}`,
      };
    }

    // Step 2: Attempt inventory decrement with rollback support
    const inventoryResult = await decrementInventoryForOrderItemWithRollback(
      eventId,
      menuItemId,
      orderItemId,
      quantity
    );

    // Step 3: If inventory decrement failed, revert order status
    if (!inventoryResult.success) {
      const { error: revertError } = await supabase
        .from("order_items")
        .update({
          status: "cooking", // Revert to cooking state
          bumped_at: null,
        })
        .eq("id", orderItemId);

      if (revertError) {
        console.error(`[KDS] Failed to revert order status for ${orderItemId}:`, revertError);
      }

      return {
        success: false,
        orderItemId,
        inventoryResult,
        message: `Order marked as done but inventory decrement failed: ${inventoryResult.message}. Order status reverted to cooking.`,
      };
    }

    // Step 4: Success - order is done and inventory is decremented
    return {
      success: true,
      orderItemId,
      inventoryResult,
      message: `Order completed successfully. Inventory decremented (${inventoryResult.changes} ingredients affected, ${inventoryResult.alertsCreated} low stock alerts created).`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[KDS] Error handling order completion for ${orderItemId}:`, error);

    // Attempt to revert order status on unexpected errors
    try {
      await supabase
        .from("order_items")
        .update({
          status: "cooking",
          bumped_at: null,
        })
        .eq("id", orderItemId);
    } catch (revertError) {
      console.error(`[KDS] Failed to revert order status:`, revertError);
    }

    return {
      success: false,
      orderItemId,
      inventoryResult: {
        success: false,
        transactionId: "",
        status: TransactionStatus.FAILED,
        message: errorMessage,
        changes: 0,
        alertsCreated: 0,
        error: errorMessage,
      },
      message: `Unexpected error during order completion: ${errorMessage}`,
    };
  }
}

/**
 * Handle batch order completion (for multiple items at once)
 * 
 * Useful for marking all items in a course as done simultaneously.
 * Processes items sequentially to ensure proper error handling.
 * 
 * @param orderItemIds - Array of order item IDs to complete
 * @param eventId - The event ID for inventory tracking
 * @returns Array of completion results
 */
export async function handleBatchOrderCompletion(
  orderItemIds: string[],
  eventId: string
): Promise<OrderCompletionResult[]> {
  const results: OrderCompletionResult[] = [];

  // Fetch order items with menu item details
  const { data: orderItems, error: fetchError } = await supabase
    .from("order_items")
    .select(
      `
      id,
      menu_item_id,
      quantity,
      fired_courses (
        event_id
      )
    `
    )
    .in("id", orderItemIds);

  if (fetchError || !orderItems) {
    console.error("[KDS] Failed to fetch order items:", fetchError);
    return orderItemIds.map((id) => ({
      success: false,
      orderItemId: id,
      inventoryResult: {
        success: false,
        transactionId: "",
        status: TransactionStatus.FAILED,
        message: "Failed to fetch order item details",
        changes: 0,
        alertsCreated: 0,
      },
      message: "Failed to fetch order item details",
    }));
  }

  // Process each order item
  for (const orderItem of orderItems) {
    const result = await handleOrderItemCompletion(
      orderItem.id,
      eventId,
      orderItem.menu_item_id,
      orderItem.quantity
    );
    results.push(result);
  }

  return results;
}

/**
 * Recover unprocessed order items
 * 
 * Finds order items that are marked as "done" but don't have corresponding
 * inventory transactions. This can happen if the inventory decrement failed
 * but the order status wasn't reverted.
 * 
 * @param eventId - The event ID to check
 * @returns Array of unprocessed order item IDs
 */
export async function findUnprocessedOrderItems(eventId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_unprocessed_order_items", {
    p_event_id: eventId,
  });

  if (error) {
    console.error("[KDS] Failed to find unprocessed order items:", error);
    return [];
  }

  return (data || []).map((item: any) => item.order_item_id);
}

/**
 * Retry inventory decrement for an order item
 * 
 * If an order item's inventory decrement failed, this function allows
 * operators to retry the decrement after resolving the underlying issue
 * (e.g., restocking ingredients).
 * 
 * @param orderItemId - The order item ID to retry
 * @param eventId - The event ID for inventory tracking
 * @returns Result of the retry attempt
 */
export async function retryInventoryDecrement(
  orderItemId: string,
  eventId: string
): Promise<TransactionResult> {
  // Fetch order item details
  const { data: orderItem, error: fetchError } = await supabase
    .from("order_items")
    .select("menu_item_id, quantity")
    .eq("id", orderItemId)
    .single();

  if (fetchError || !orderItem) {
    return {
      success: false,
      transactionId: "",
      status: TransactionStatus.FAILED,
      message: "Failed to fetch order item details",
      changes: 0,
      alertsCreated: 0,
      error: fetchError?.message || "Order item not found",
    };
  }

  // Attempt inventory decrement
  return decrementInventoryForOrderItemWithRollback(
    eventId,
    orderItem.menu_item_id,
    orderItemId,
    orderItem.quantity
  );
}

/**
 * Get transaction history for an order item
 * 
 * Retrieve all inventory transactions associated with a specific order item.
 * Useful for debugging and auditing.
 * 
 * @param orderItemId - The order item ID
 * @returns Array of transaction details
 */
export async function getOrderItemTransactionHistory(orderItemId: string) {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("order_item_id", orderItemId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[KDS] Failed to fetch transaction history:", error);
    return [];
  }

  return data || [];
}

/**
 * Validate inventory before firing a course
 * 
 * Pre-flight check to ensure sufficient inventory exists for all items
 * in a course before firing it. This prevents wasting kitchen time
 * on orders that can't be fulfilled due to inventory constraints.
 * 
 * @param courseId - The course ID to validate
 * @param eventId - The event ID for inventory tracking
 * @returns Object with validation result and details
 */
export async function validateInventoryBeforeFiringCourse(
  courseId: string,
  eventId: string
): Promise<{
  valid: boolean;
  message: string;
  insufficientItems: Array<{
    menuItemId: string;
    menuItemName: string;
    requiredQuantity: number;
    availableQuantity: number;
  }>;
}> {
  const insufficientItems: Array<{
    menuItemId: string;
    menuItemName: string;
    requiredQuantity: number;
    availableQuantity: number;
  }> = [];

  // Fetch menu items in the course
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name")
    .eq("course_id", courseId);

  if (menuError || !menuItems) {
    return {
      valid: false,
      message: "Failed to fetch menu items for course",
      insufficientItems: [],
    };
  }

  // Check inventory for each menu item
  for (const menuItem of menuItems) {
    // Fetch recipe ingredients
    const { data: recipeIngredients, error: recipeError } = await supabase
      .from("recipe_ingredients")
      .select("ingredient_id, quantity")
      .eq("menu_item_id", menuItem.id);

    if (recipeError || !recipeIngredients) {
      continue;
    }

    // Check stock for each ingredient
    for (const ingredient of recipeIngredients) {
      const { data: stockData } = await supabase
        .from("stock_levels")
        .select("quantity")
        .eq("ingredient_id", ingredient.ingredient_id)
        .eq("event_id", eventId)
        .single();

      const availableStock = stockData?.quantity || 0;
      const requiredStock = ingredient.quantity;

      if (availableStock < requiredStock) {
        insufficientItems.push({
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          requiredQuantity: requiredStock,
          availableQuantity: availableStock,
        });
      }
    }
  }

  if (insufficientItems.length > 0) {
    return {
      valid: false,
      message: `Insufficient inventory for ${insufficientItems.length} item(s)`,
      insufficientItems,
    };
  }

  return {
    valid: true,
    message: "Sufficient inventory available for all items in course",
    insufficientItems: [],
  };
}
