"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  ShoppingCart,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastOrdered: Date;
  status: "good" | "low" | "critical";
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    name: "Atlantic Salmon Fillets",
    category: "Protein",
    currentStock: 45,
    unit: "lbs",
    minStock: 30,
    costPerUnit: 12.50,
    supplier: "Fresh Catch Seafood",
    lastOrdered: new Date(2026, 0, 5),
    status: "good",
  },
  {
    id: "2",
    name: "Organic Spinach",
    category: "Vegetables",
    currentStock: 8,
    unit: "lbs",
    minStock: 15,
    costPerUnit: 3.50,
    supplier: "Green Valley Farms",
    lastOrdered: new Date(2026, 0, 3),
    status: "critical",
  },
  {
    id: "3",
    name: "Parmesan Cheese",
    category: "Dairy",
    currentStock: 22,
    unit: "lbs",
    minStock: 20,
    costPerUnit: 8.00,
    supplier: "Artisan Dairy Co",
    lastOrdered: new Date(2026, 0, 7),
    status: "low",
  },
  {
    id: "4",
    name: "Extra Virgin Olive Oil",
    category: "Pantry",
    currentStock: 18,
    unit: "liters",
    minStock: 10,
    costPerUnit: 15.00,
    supplier: "Mediterranean Imports",
    lastOrdered: new Date(2025, 11, 28),
    status: "good",
  },
  {
    id: "5",
    name: "Quinoa",
    category: "Grains",
    currentStock: 12,
    unit: "lbs",
    minStock: 25,
    costPerUnit: 4.50,
    supplier: "Whole Grains Supply",
    lastOrdered: new Date(2026, 0, 2),
    status: "critical",
  },
];

const CATEGORIES = ["All", "Protein", "Vegetables", "Dairy", "Grains", "Pantry"];

const statusConfig = {
  good: {
    label: "In Stock",
    color: "bg-green-100 text-green-800",
    icon: TrendingUp,
    iconColor: "text-green-600",
  },
  low: {
    label: "Low Stock",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  critical: {
    label: "Critical",
    color: "bg-red-100 text-red-800",
    icon: TrendingDown,
    iconColor: "text-red-600",
  },
};

export default function InventoryPage() {
  const [inventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = inventory.reduce(
    (sum, item) => sum + item.currentStock * item.costPerUnit,
    0
  );
  const lowStockCount = inventory.filter((item) => item.status === "low").length;
  const criticalCount = inventory.filter((item) => item.status === "critical").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track stock levels and manage suppliers
            </p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Create Order
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
              <Plus className="h-5 w-5 mr-2" />
              New Item
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Inventory Value
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${totalValue.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Low Stock Items
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {lowStockCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Critical Items
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {criticalCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="good">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="critical">Critical</option>
          </select>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const config = statusConfig[item.status];
                const StatusIcon = config.icon;
                const stockPercentage = (item.currentStock / item.minStock) * 100;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            stockPercentage > 100
                              ? "bg-green-600"
                              : stockPercentage > 50
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                          style={{
                            width: `${Math.min(stockPercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className={`h-3 w-3 mr-1 ${config.iconColor}`} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-amber-600 hover:text-amber-900 mr-3">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredInventory.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No inventory items found
              </h3>
              <p className="text-sm">
                Try adjusting your search or filters.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
