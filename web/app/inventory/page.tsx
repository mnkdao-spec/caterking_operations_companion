"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { getInventoryItems, getPriceAlerts } from "@/lib/supabase-services";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  ShoppingCart,
  Loader2,
  ChevronUp,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
  reorder_level: number;
  cost_per_unit: number;
  supplier: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  last_price_paid?: number;
  avg_price_paid?: number;
}

interface PriceAlert {
  ingredient_name: string;
  new_price: number;
  historical_avg: number;
  percent_increase: number;
  vendor_name: string;
  bill_date: string;
}

const CATEGORIES = ["All", "Protein", "Vegetables", "Dairy", "Grains", "Pantry", "Dry Goods"];

const statusConfig = {
  in_stock: {
    label: "In Stock",
    color: "bg-green-100 text-green-800",
    icon: TrendingUp,
    iconColor: "text-green-600",
  },
  low_stock: {
    label: "Low Stock",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  out_of_stock: {
    label: "Critical",
    color: "bg-red-100 text-red-800",
    icon: TrendingDown,
    iconColor: "text-red-600",
  },
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    try {
      const [items, alertData] = await Promise.all([
        getInventoryItems(),
        getPriceAlerts()
      ]);
      setInventory(items);
      setAlerts(alertData);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = inventory.reduce(
    (sum, item) => sum + (Number(item.current_quantity) * Number(item.cost_per_unit)),
    0
  );
  const lowStockCount = inventory.filter((item) => item.status === "low_stock").length;
  const criticalCount = inventory.filter((item) => item.status === "out_of_stock").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin h-8 w-8 text-amber-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time stock tracking and vendor price integrity
            </p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
              <Plus className="h-5 w-5 mr-2" />
              New Ingredient
            </button>
          </div>
        </div>

        {/* Price Alerts Banner (The "Integrity" Feature) */}
        {alerts.length > 0 && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="text-red-600 h-6 w-6" />
              <h2 className="text-lg font-bold text-red-900">Vendor Price Alerts Detected</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{alert.vendor_name}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{alert.ingredient_name}</p>
                    </div>
                    <div className="flex items-center text-red-600 font-black text-sm">
                      <ChevronUp className="h-4 w-4" />
                      {alert.percent_increase.toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs">
                    <span className="text-gray-500">Avg: ${alert.historical_avg.toFixed(2)}</span>
                    <span className="text-red-700 font-bold">New: ${alert.new_price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-50 p-3 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inventory Asset Value</dt>
                    <dd className="text-2xl font-black text-gray-900">${totalValue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-50 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Warnings</dt>
                    <dd className="text-2xl font-black text-gray-900">{lowStockCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-50 p-3 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                    <dd className="text-2xl font-black text-gray-900">{criticalCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm transition-all"
              placeholder="Search by name or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow-sm overflow-hidden rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Item / Category</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Last Paid Cost</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Supplier Avg</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInventory.map((item) => {
                const config = statusConfig[item.status];
                const StatusIcon = config.icon;
                const stockPercentage = (item.current_quantity / item.reorder_level) * 100;

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gray-50 p-2 rounded-lg mr-3 group-hover:bg-amber-50 transition-colors">
                          <Package className="h-5 w-5 text-gray-400 group-hover:text-amber-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {item.current_quantity} {item.unit}
                      </div>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            item.status === 'in_stock' ? "bg-green-500" : item.status === 'low_stock' ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ${Number(item.last_price_paid || item.cost_per_unit).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">per {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        ${Number(item.avg_price_paid || item.cost_per_unit).toFixed(2)}
                        {item.last_price_paid && item.avg_price_paid && item.last_price_paid > item.avg_price_paid && (
                          <ArrowUpRight className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${config.iconColor}`} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-amber-600 transition-colors p-2"><Edit className="h-4 w-4" /></button>
                      <button className="text-gray-400 hover:text-blue-600 transition-colors p-2"><ShoppingCart className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}