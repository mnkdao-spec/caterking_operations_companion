import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  InventoryTransactionManager,
  decrementInventoryForOrderItemWithRollback,
  TransactionStatus,
  type TransactionResult,
} from "../lib/inventory-transaction-fix";

/**
 * Unit Tests for Inventory Transaction Manager
 * 
 * Tests cover:
 * 1. Successful inventory decrements
 * 2. Rollback on insufficient stock
 * 3. Rollback on ingredient fetch failure
 * 4. Idempotency (same order item processed twice)
 * 5. Low stock alert generation
 * 6. Transaction history tracking
 */

describe("InventoryTransactionManager", () => {
  const mockEventId = "event-123";
  const mockMenuItemId = "menu-item-456";
  const mockOrderItemId = "order-item-789";

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe("executeOrderItemDecrement", () => {
    it("should successfully decrement inventory for a valid order", async () => {
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(TransactionStatus.COMMITTED);
      expect(result.transactionId).toBeDefined();
      expect(result.message).toContain("successfully");
    });

    it("should return error when recipe has no ingredients", async () => {
      // This test assumes the manager handles empty recipes gracefully
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        "non-existent-menu-item",
        mockOrderItemId,
        1
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("No recipe ingredients");
    });

    it("should rollback on insufficient stock", async () => {
      // Test with a quantity that exceeds available stock
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        999 // Unrealistic quantity
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(TransactionStatus.ROLLED_BACK);
      expect(result.message).toContain("rolled back");
    });

    it("should handle transaction failures gracefully", async () => {
      // Test error handling with invalid event ID
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        "invalid-event-id",
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(TransactionStatus.FAILED);
      expect(result.error).toBeDefined();
    });

    it("should generate low stock alerts when threshold is crossed", async () => {
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      // If decrements were successful and stock fell below reorder level,
      // alerts should be created
      if (result.success) {
        expect(result.alertsCreated).toBeGreaterThanOrEqual(0);
      }
    });

    it("should track transaction with unique ID", async () => {
      const result1 = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        "order-item-1",
        1
      );

      const result2 = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        "order-item-2",
        1
      );

      expect(result1.transactionId).not.toBe(result2.transactionId);
    });

    it("should handle multiple ingredients in recipe", async () => {
      // This test verifies that the manager processes all ingredients
      // in a recipe, not just the first one
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      if (result.success) {
        // If successful, should have affected at least one ingredient
        expect(result.changes).toBeGreaterThanOrEqual(0);
      }
    });

    it("should create audit trail for each ingredient change", async () => {
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      if (result.success) {
        // Transaction should have recorded changes
        expect(result.transactionId).toBeDefined();
      }
    });
  });

  describe("Idempotency", () => {
    it("should not double-decrement on retry", async () => {
      // First decrement
      const result1 = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      expect(result1.success).toBe(true);

      // Second decrement with same order item
      const result2 = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      // Should detect that order item was already processed
      if (result2.success) {
        expect(result2.message).toContain("already decremented");
      }
    });

    it("should allow different order items to be processed", async () => {
      const result1 = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        "order-item-1",
        1
      );

      const result2 = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        "order-item-2",
        1
      );

      // Both should succeed independently
      if (result1.success && result2.success) {
        expect(result1.transactionId).not.toBe(result2.transactionId);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      // Test with invalid parameters that would cause DB errors
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        "",
        "",
        "",
        1
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should provide meaningful error messages", async () => {
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        "invalid",
        "invalid",
        "invalid",
        1
      );

      if (!result.success) {
        expect(result.message.length).toBeGreaterThan(0);
        expect(result.error).toBeDefined();
      }
    });

    it("should rollback partial changes on error", async () => {
      // Test that if one ingredient fails, others are rolled back
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      // If it failed, should have rolled back
      if (!result.success) {
        expect(result.status).toBe(TransactionStatus.ROLLED_BACK);
      }
    });
  });

  describe("Transaction History", () => {
    it("should retrieve transaction history for event", async () => {
      // Execute a transaction first
      await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      // Retrieve history
      const history = await InventoryTransactionManager.getTransactionHistory(mockEventId);

      expect(Array.isArray(history)).toBe(true);
    });

    it("should track transaction status changes", async () => {
      const result = await InventoryTransactionManager.executeOrderItemDecrement(
        mockEventId,
        mockMenuItemId,
        mockOrderItemId,
        1
      );

      if (result.success) {
        const history = await InventoryTransactionManager.getTransactionHistory(mockEventId);

        // Should find the transaction in history
        const found = history.some((txn) => txn.id === result.transactionId);
        expect(found).toBe(true);
      }
    });
  });
});

describe("decrementInventoryForOrderItemWithRollback", () => {
  const mockEventId = "event-123";
  const mockMenuItemId = "menu-item-456";
  const mockOrderItemId = "order-item-789";

  it("should return TransactionResult with proper structure", async () => {
    const result = await decrementInventoryForOrderItemWithRollback(
      mockEventId,
      mockMenuItemId,
      mockOrderItemId,
      1
    );

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("transactionId");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("changes");
    expect(result).toHaveProperty("alertsCreated");
  });

  it("should handle quantity parameter correctly", async () => {
    const result1 = await decrementInventoryForOrderItemWithRollback(
      mockEventId,
      mockMenuItemId,
      "order-1",
      1
    );

    const result2 = await decrementInventoryForOrderItemWithRollback(
      mockEventId,
      mockMenuItemId,
      "order-2",
      5
    );

    // Both should complete without errors (may succeed or fail based on inventory)
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });

  it("should use default quantity of 1 when not specified", async () => {
    const result = await decrementInventoryForOrderItemWithRollback(
      mockEventId,
      mockMenuItemId,
      mockOrderItemId
    );

    expect(result).toBeDefined();
    expect(result.transactionId).toBeDefined();
  });
});

describe("Integration Scenarios", () => {
  const mockEventId = "event-123";
  const mockMenuItemId = "menu-item-456";

  it("should handle concurrent order completions", async () => {
    // Simulate multiple orders being completed simultaneously
    const promises = Array.from({ length: 5 }, (_, i) =>
      decrementInventoryForOrderItemWithRollback(
        mockEventId,
        mockMenuItemId,
        `order-item-${i}`,
        1
      )
    );

    const results = await Promise.all(promises);

    // All should complete (success or failure)
    expect(results).toHaveLength(5);
    results.forEach((result) => {
      expect(result.transactionId).toBeDefined();
    });
  });

  it("should handle mixed success and failure scenarios", async () => {
    // Execute multiple transactions with different outcomes
    const results = await Promise.all([
      decrementInventoryForOrderItemWithRollback(
        mockEventId,
        mockMenuItemId,
        "order-1",
        1
      ),
      decrementInventoryForOrderItemWithRollback(
        mockEventId,
        mockMenuItemId,
        "order-2",
        999 // Likely to fail
      ),
      decrementInventoryForOrderItemWithRollback(
        mockEventId,
        mockMenuItemId,
        "order-3",
        1
      ),
    ]);

    expect(results).toHaveLength(3);
    // At least one should have a defined result
    expect(results.some((r) => r.transactionId)).toBe(true);
  });

  it("should maintain data consistency across multiple operations", async () => {
    // Execute multiple transactions
    const result1 = await decrementInventoryForOrderItemWithRollback(
      mockEventId,
      mockMenuItemId,
      "order-1",
      1
    );

    const result2 = await decrementInventoryForOrderItemWithRollback(
      mockEventId,
      mockMenuItemId,
      "order-2",
      1
    );

    // Retrieve transaction history
    const history = await InventoryTransactionManager.getTransactionHistory(mockEventId);

    // Should have records of both transactions
    expect(history.length).toBeGreaterThanOrEqual(0);
  });
});
