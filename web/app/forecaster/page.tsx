"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { get30DayForecast } from "@/lib/supabase-services";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ChefHat, 
  Building2, 
  DollarSign, 
  ArrowUpRight,
  Target,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from "recharts";

export default function ForecasterPage() {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await get30DayForecast();
      setForecast(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    </DashboardLayout>
  );

  const pieData = [
    { name: "Labor", value: forecast.expenses.labor, color: "#EF4444" },
    { name: "Food", value: forecast.expenses.food, color: "#F59E0B" },
    { name: "Overhead", value: forecast.expenses.overhead, color: "#3B82F6" },
    { name: "Net Profit", value: forecast.net_profit > 0 ? forecast.net_profit : 0, color: "#10B981" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Target className="text-amber-600 h-10 w-10" />
              Profitability Forecaster
            </h1>
            <p className="text-gray-500 font-medium text-lg mt-1">30-Day Financial Trajectory & Margin Analysis</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Forecast Events</p>
              <p className="text-2xl font-black text-gray-900">{forecast.event_count}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        {/* Main Projection Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-100 overflow-hidden">
            <div className="bg-amber-600 p-8 text-white">
              <p className="text-amber-100 font-bold uppercase tracking-widest text-xs">Net Projected Profit</p>
              <div className="flex items-end gap-4 mt-2">
                <h2 className="text-6xl font-black tracking-tighter">${forecast.net_profit.toLocaleString()}</h2>
                <div className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-bold mb-2">
                  <ArrowUpRight className="h-4 w-4" />
                  {forecast.margin_percent.toFixed(1)}% Margin
                </div>
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-gray-400 font-bold text-xs uppercase">Total Revenue</p>
                <p className="text-2xl font-black text-gray-900">${forecast.revenue.toLocaleString()}</p>
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-bold text-xs uppercase">Labor Cost</p>
                <p className="text-2xl font-black text-red-600">${forecast.expenses.labor.toLocaleString()}</p>
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(forecast.expenses.labor / forecast.revenue) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-bold text-xs uppercase">Food Cost</p>
                <p className="text-2xl font-black text-orange-600">${forecast.expenses.food.toLocaleString()}</p>
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(forecast.expenses.food / forecast.revenue) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Allocation Breakdown</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <ChefHat className="text-red-600 h-6 w-6 mb-3" />
            <h4 className="text-red-900 font-black text-sm uppercase tracking-tighter">Food Cost Target</h4>
            <p className="text-2xl font-black text-red-700">35.0%</p>
            <p className="text-xs text-red-600 mt-1">Goal: Keep under 32%</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <Users className="text-blue-600 h-6 w-6 mb-3" />
            <h4 className="text-blue-900 font-black text-sm uppercase tracking-tighter">Labor Efficiency</h4>
            <p className="text-2xl font-black text-blue-700">{((forecast.expenses.labor / forecast.revenue) * 100).toFixed(1)}%</p>
            <p className="text-xs text-blue-600 mt-1">Shift hours vs Revenue</p>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <TrendingUp className="text-green-600 h-6 w-6 mb-3" />
            <h4 className="text-green-900 font-black text-sm uppercase tracking-tighter">Projected ROA</h4>
            <p className="text-2xl font-black text-green-700">14.2%</p>
            <p className="text-xs text-green-600 mt-1">Return on Assets</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <Building2 className="text-gray-600 h-6 w-6 mb-3" />
            <h4 className="text-gray-900 font-black text-sm uppercase tracking-tighter">Overhead Burn</h4>
            <p className="text-2xl font-black text-gray-700">${forecast.expenses.overhead.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Fixed costs estimate</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
