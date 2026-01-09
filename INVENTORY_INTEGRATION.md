# Inventory Auto-Decrement Integration Guide

This document explains how the inventory auto-decrement system works in CaterKing's Kitchen Display System (KDS).

## Overview

The inventory system automatically tracks ingredient usage as orders are completed in the KDS. When a station bumps an item (marks it as done), the system:

1. Identifies all ingredients in that menu item's recipe
2. Decrements the stock levels for each ingredient
3. Creates an audit transaction record
4. Checks if any ingredients have fallen below reorder levels
5. Creates low-stock alerts if needed
6. Syncs updates to all connected tablets in real-time

## Database Schema

### Ingredients Table

Stores the master list of all ingredients used in your catering business.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Ingredient name (e.g., "Ribeye Steak") |
| `unit` | TEXT | Measurement unit (oz, lb, ml, l, count, bunch) |
| `category` | TEXT | Category for organization (Protein, Vegetable, Dairy, etc.) |
| `cost_per_unit` | DECIMAL | Cost to calculate inventory value |
| `reorder_level` | DECIMAL | Threshold for low-stock alerts |
| `supplier` | TEXT | Optional supplier name |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Stock Levels Table

Tracks current quantity of each ingredient, either globally or per-event.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ingredient_id` | UUID | Foreign key to ingredients |
| `event_id` | UUID | Event ID (NULL for global stock) |
| `quantity` | DECIMAL | Current stock level |
| `last_updated` | TIMESTAMP | When stock was last changed |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Recipe Ingredients Table

Defines which ingredients go into each menu item and in what quantities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `menu_item_id` | UUID | Foreign key to menu items |
| `ingredient_id` | UUID | Foreign key to ingredients |
| `quantity` | DECIMAL | Amount used per serving |
| `created_at` | TIMESTAMP | Creation timestamp |

### Inventory Transactions Table

Complete audit trail of all inventory changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | Event ID |
| `ingredient_id` | UUID | Foreign key to ingredients |
| `transaction_type` | TEXT | 'initial_stock', 'decrement', 'adjustment', 'restock' |
| `quantity_change` | DECIMAL | Amount added/removed (negative for decrement) |
| `quantity_before` | DECIMAL | Stock level before transaction |
| `quantity_after` | DECIMAL | Stock level after transaction |
| `reason` | TEXT | Why the change occurred |
| `order_item_id` | UUID | Related order item (if applicable) |
| `created_by` | TEXT | User or system that made the change |
| `created_at` | TIMESTAMP | When the transaction occurred |

### Low Stock Alerts Table

Tracks when ingredients fall below reorder levels.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | Event ID |
| `ingredient_id` | UUID | Foreign key to ingredients |
| `current_level` | DECIMAL | Stock level when alert was created |
| `reorder_level` | DECIMAL | Reorder threshold |
| `acknowledged` | BOOLEAN | Whether staff has acknowledged the alert |
| `acknowledged_at` | TIMESTAMP | When acknowledged |
| `acknowledged_by` | TEXT | User who acknowledged |
| `created_at` | TIMESTAMP | When alert was created |

## Service Layer

### Ingredients Service

```typescript
import { ingredientsService } from "@/lib/supabase-inventory";

// Get all ingredients
const ingredients = await ingredientsService.getAll();

// Get by category
const proteins = await ingredientsService.getByCategory("Protein");

// Create new ingredient
const newIngredient = await ingredientsService.create({
  name: "Ribeye Steak",
  unit: "lb",
  category: "Protein",
  cost_per_unit: 15.99,
  reorder_level: 5,
});
```

### Stock Levels Service

```typescript
import { stockLevelsService } from "@/lib/supabase-inventory";

// Get stock for event
const stock = await stockLevelsService.getForEvent("event-id");

// Set initial stock
await stockLevelsService.setInitialStock("ingredient-id", 50, "event-id");

// Adjust stock
await stockLevelsService.adjustStock(
  "ingredient-id",
  -8,
  "order_completed",
  "event-id"
);
```

### Recipe Ingredients Service

```typescript
import { recipeIngredientsService } from "@/lib/supabase-inventory";

// Get recipe for menu item
const recipe = await recipeIngredientsService.getForMenuItem("menu-item-id");

// Add ingredient to recipe
await recipeIngredientsService.addIngredientToRecipe(
  "menu-item-id",
  "ingredient-id",
  8 // quantity per serving
);
```

### Main Decrement Function

The core function that handles inventory decrement when an order is bumped:

```typescript
import { decrementInventoryForOrderItem } from "@/lib/supabase-inventory";

// Called when a station bumps an item
const result = await decrementInventoryForOrderItem(
  "event-id",
  "menu-item-id",
  "order-item-id",
  1 // quantity (number of servings)
);

// Returns:
// {
//   success: boolean,
//   message: string,
//   alertsCreated: number
// }
```

## Integration with KDS

### Using the Inventory-Enabled Context

```typescript
import { useKDSInventory } from "@/lib/kds-context-with-inventory";

function StationDisplay() {
  const { bumpItemWithInventory, lowStockAlerts } = useKDSInventory();

  const handleBump = async (itemId: string) => {
    // This automatically decrements inventory
    await bumpItemWithInventory(itemId);
  };

  return (
    <>
      {lowStockAlerts.length > 0 && (
        <AlertBanner count={lowStockAlerts.length} />
      )}
      <BumpButton onPress={() => handleBump(itemId)} />
    </>
  );
}
```

### Workflow

1. **Order Fired**: Expo station fires a course for a table group
2. **Items Queued**: Order items appear on station displays
3. **Station Bumps**: Chef marks item as done by tapping the big bump button
4. **Inventory Decremented**: System automatically:
   - Looks up the menu item's recipe
   - Decrements each ingredient by the recipe amount
   - Creates transaction record
   - Checks for low stock
   - Creates alerts if needed
5. **Real-Time Sync**: All tablets see updated inventory instantly
6. **Alert Notification**: Staff see low-stock alerts on their tablets

## Inventory Tracking UI

The **Inventory Tracking** screen shows:

- **Total Inventory Value**: Sum of all current stock × cost per unit
- **Low Stock Count**: Number of items below reorder level
- **Out of Stock Count**: Number of items at zero
- **Stock Level Bars**: Visual representation of current vs. reorder level
- **Filter Tabs**: View all items, low stock only, or out of stock only

## Low Stock Alerts

When an ingredient falls below its reorder level:

1. An alert is created in the `low_stock_alerts` table
2. All connected tablets receive the alert via Realtime
3. Staff can:
   - **Acknowledge**: Mark that they've seen the alert
   - **Reorder Now**: Trigger a reorder workflow
4. Alerts remain visible until acknowledged

## Real-Time Synchronization

All inventory changes sync instantly across tablets via Supabase Realtime:

```typescript
import { inventoryRealtimeSubscriptions } from "@/lib/supabase-inventory";

// Subscribe to stock level changes
const unsubscribe = inventoryRealtimeSubscriptions.subscribeToStockLevelChanges(
  "event-id",
  (updatedLevel) => {
    // Update UI with new stock level
  }
);

// Subscribe to low stock alerts
const unsubscribeAlerts = inventoryRealtimeSubscriptions.subscribeToLowStockAlerts(
  "event-id",
  (alert) => {
    // Show alert to user
  }
);
```

## Audit Trail

Every inventory change is recorded in `inventory_transactions`:

```typescript
import { inventoryTransactionsService } from "@/lib/supabase-inventory";

// Get all transactions for an event
const transactions = await inventoryTransactionsService.getForEvent("event-id");

// Get transactions for specific ingredient
const ingredientHistory = await inventoryTransactionsService.getForIngredient(
  "ingredient-id",
  "event-id"
);

// Get transactions for specific order item
const orderTransactions = await inventoryTransactionsService.getForOrderItem(
  "order-item-id"
);
```

## Example Workflow

### Setting Up for an Event

```typescript
// 1. Get event and load recipes
const event = await eventsService.getEventById("evt-1");
const courses = await coursesService.getCoursesByEvent("evt-1");

// 2. Set initial stock levels
for (const ingredient of ingredients) {
  await stockLevelsService.setInitialStock(
    ingredient.id,
    ingredient.initial_quantity,
    "evt-1"
  );
}

// 3. Subscribe to updates
subscribeToInventoryUpdates();
```

### During Service

```typescript
// When a station bumps an item
const result = await bumpItemWithInventory("order-item-123");

if (result.alertsCreated > 0) {
  // Show notification to user
  showNotification(`${result.alertsCreated} low stock alerts`);
}

// Check inventory status anytime
const status = await inventoryStatusService.getEventInventoryStatus("evt-1");
const lowStockItems = status.filter((i) => i.status !== "in_stock");
```

## Performance Considerations

- **Indexes**: All foreign keys and status fields are indexed for fast queries
- **Batch Operations**: Fire entire courses at once, not individual items
- **Realtime Limits**: Configured for 10 events per second per channel
- **Denormalization**: `station` field in `order_items` for quick filtering
- **Pagination**: For large events, consider paginating transaction history

## Testing

Run the inventory tests:

```bash
pnpm test -- inventory.test.ts
```

Tests validate:
- Schema integrity
- Decrement calculations
- Transaction recording
- Alert creation
- Status calculations
- Real-time subscriptions
- Error handling

## Troubleshooting

### Stock Not Decrementing

1. Check that recipe ingredients are defined for the menu item
2. Verify stock levels exist for the event
3. Check browser console for errors
4. Ensure Supabase connection is active

### Alerts Not Appearing

1. Verify Realtime is enabled on `low_stock_alerts` table
2. Check that reorder levels are set correctly
3. Confirm subscription is active
4. Check network connectivity

### Inventory Value Incorrect

1. Verify `cost_per_unit` is set for all ingredients
2. Check that stock quantities are accurate
3. Ensure no duplicate stock level records

## Future Enhancements

- [ ] Ingredient substitution suggestions
- [ ] Automatic reorder integration with suppliers
- [ ] Predictive inventory based on historical usage
- [ ] Cost analysis and margin tracking
- [ ] Waste tracking and reporting
- [ ] Inventory forecasting for future events
- [ ] Barcode scanning for stock counts
- [ ] Multi-location inventory management
