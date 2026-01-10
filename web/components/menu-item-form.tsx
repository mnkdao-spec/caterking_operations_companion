import { useState, FormEvent } from "react";
import { Modal } from "./modal";
import { createMenuItem, updateMenuItem } from "@/lib/supabase-services";

interface MenuItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuItem?: any; // Existing menu item for edit mode
}

export function MenuItemForm({ isOpen, onClose, onSuccess, menuItem }: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: menuItem?.name || "",
    category: menuItem?.category || "appetizer",
    description: menuItem?.description || "",
    dietary_info: menuItem?.dietary_info || "",
    prep_time_minutes: menuItem?.prep_time_minutes || "",
    cost_per_serving: menuItem?.cost_per_serving || "",
    price_per_serving: menuItem?.price_per_serving || "",
    min_order_quantity: menuItem?.min_order_quantity || "1",
    is_available: menuItem?.is_available ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dataToSubmit = {
        ...formData,
        prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes as string) : null,
        cost_per_serving: formData.cost_per_serving ? parseFloat(formData.cost_per_serving as string) : null,
        price_per_serving: formData.price_per_serving ? parseFloat(formData.price_per_serving as string) : null,
        min_order_quantity: formData.min_order_quantity ? parseInt(formData.min_order_quantity as string) : 1,
      };

      if (menuItem) {
        await updateMenuItem(menuItem.id, dataToSubmit);
      } else {
        await createMenuItem(dataToSubmit);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save menu item");
    } finally {
      setLoading(false);
    }
  };

  const margin = formData.cost_per_serving && formData.price_per_serving
    ? ((parseFloat(formData.price_per_serving as string) - parseFloat(formData.cost_per_serving as string)) / parseFloat(formData.price_per_serving as string) * 100).toFixed(1)
    : "0";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={menuItem ? "Edit Menu Item" : "Add New Menu Item"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Grilled Salmon with Lemon Butter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="appetizer">Appetizer</option>
              <option value="entree">Entrée</option>
              <option value="side">Side Dish</option>
              <option value="dessert">Dessert</option>
              <option value="beverage">Beverage</option>
            </select>
          </div>

          {/* Prep Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prep Time (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.prep_time_minutes}
              onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the dish and preparation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Dietary Info */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Information
            </label>
            <input
              type="text"
              value={formData.dietary_info}
              onChange={(e) => setFormData({ ...formData, dietary_info: e.target.value })}
              placeholder="e.g., Gluten-Free, Vegan, Contains Nuts"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Cost Per Serving */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Per Serving ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_per_serving}
              onChange={(e) => setFormData({ ...formData, cost_per_serving: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Price Per Serving */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Per Serving ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price_per_serving}
              onChange={(e) => setFormData({ ...formData, price_per_serving: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Margin Display */}
          {formData.cost_per_serving && formData.price_per_serving && (
            <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-900">Profit Margin:</span>
                <span className="text-lg font-bold text-amber-700">{margin}%</span>
              </div>
              <div className="mt-1 text-xs text-amber-700">
                Profit: ${(parseFloat(formData.price_per_serving as string) - parseFloat(formData.cost_per_serving as string)).toFixed(2)} per serving
              </div>
            </div>
          )}

          {/* Min Order Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Order Quantity
            </label>
            <input
              type="number"
              min="1"
              value={formData.min_order_quantity}
              onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Availability */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
              Available for ordering
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : menuItem ? "Update Item" : "Add Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
