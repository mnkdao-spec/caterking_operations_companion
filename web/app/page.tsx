"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { getDashboardStats, getDepositAlerts } from "@/lib/supabase-services";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  HandCoins,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
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

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    totalRevenue: number;
    activeEvents: number;
    totalClients: number;
    inventoryAlerts: number;
    eventTypeDistribution: { name: string; value: number; color: string }[];
    topClients: { name: string; revenue: number; status: string }[];
    revenueTrend: { month: string; revenue: number }[];
  }>({
    totalRevenue: 0,
    activeEvents: 0,
    totalClients: 0,
    inventoryAlerts: 0,
    eventTypeDistribution: [],
    topClients: [],
    revenueTrend: [],
  });
  
  const [depositAlerts, setDepositAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [dashboardData, alerts] = await Promise.all([
          getDashboardStats(),
          getDepositAlerts()
        ]);
        setStats(dashboardData);
        setDepositAlerts(alerts);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center h-[60vh]">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">Business intelligence for CaterKing Operations</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest">System Status</p>
            <p className="text-sm font-bold text-green-600 flex items-center gap-1.5">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span> Live & Healthy
            </p>
          </div>
        </div>

        {/* Deposit Delinquency Banner (Cash Flow Guardrail) */}
        {depositAlerts.length > 0 && (
          <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <HandCoins className="text-amber-600 h-6 w-6" />
              <h2 className="text-lg font-bold text-amber-900">Cash Flow Warnings: Missing Deposits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depositAlerts.map((alert, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm group hover:border-amber-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{alert.client_name}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{alert.event_name}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${alert.days_until_event < 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {alert.days_until_event} Days Left
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Required Deposit</p>
                      <p className="text-lg font-black text-gray-900">${Number(alert.deposit_required).toFixed(2)}</p>
                    </div>
                    <button className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl"><DollarSign className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue (YTD)</p>
                <p className="text-2xl font-black text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl"><Calendar className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirmed Events</p>
                <p className="text-2xl font-black text-gray-900">{stats.activeEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl"><Users className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Clients</p>
                <p className="text-2xl font-black text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl"><AlertCircle className="h-6 w-6 text-red-600" /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Alerts</p>
                <p className="text-2xl font-black text-gray-900">{stats.inventoryAlerts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
          <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Revenue Trend (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={4} dot={{ r: 6, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Events by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.eventTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.eventTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients Table */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">High Value Partnerships</h3>
            <button className="text-xs font-bold text-amber-600 hover:text-amber-700">View All Clients</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stats.topClients.map((client, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-amber-600">${client.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}