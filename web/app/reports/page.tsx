"use client";

import { Navigation } from "@/components/navigation";
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const monthlyRevenue = [
  { month: "Jul", revenue: 42000, cost: 28000, profit: 14000 },
  { month: "Aug", revenue: 48000, cost: 31000, profit: 17000 },
  { month: "Sep", revenue: 45000, cost: 29000, profit: 16000 },
  { month: "Oct", revenue: 53000, cost: 34000, profit: 19000 },
  { month: "Nov", revenue: 58000, cost: 37000, profit: 21000 },
  { month: "Dec", revenue: 67000, cost: 42000, profit: 25000 },
];

const costBreakdown = [
  { name: "Labor", value: 45, color: "#F59E0B" },
  { name: "Ingredients", value: 35, color: "#10B981" },
  { name: "Overhead", value: 20, color: "#3B82F6" },
];

const eventTypeRevenue = [
  { type: "Corporate", revenue: 145000 },
  { type: "Wedding", revenue: 98000 },
  { type: "Private", revenue: 85000 },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Financial analysis and business insights
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
            <Download className="h-5 w-5 mr-2" />
            Export PDF
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Profit (6mo)
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      $112k
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
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Profit Margin
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      34%
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
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Events Completed
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      48
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
                  <PieChartIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Event Value
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      $6.8k
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit & Loss Chart */}
        <div className="bg-white p-6 shadow rounded-lg mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Profit & Loss Statement (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              <Bar dataKey="cost" fill="#EF4444" name="Cost" />
              <Bar dataKey="profit" fill="#10B981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown & Event Revenue */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
          {/* Cost Breakdown */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cost Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Event Type */}
          <div className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Revenue by Event Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#F59E0B" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Templates */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Available Reports
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Monthly P&L Statement",
                "Event Revenue Analysis",
                "Client Lifetime Value",
                "Inventory Valuation",
                "Staff Performance",
                "Tax Summary Report",
              ].map((report) => (
                <button
                  key={report}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      {report}
                    </span>
                  </div>
                  <Download className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
