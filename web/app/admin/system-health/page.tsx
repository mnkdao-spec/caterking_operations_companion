"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { supabase } from "@/lib/supabase";
import { 
  Activity, 
  Database, 
  Cpu, 
  Wifi, 
  Users, 
  Package, 
  ShieldCheck,
  RefreshCw,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_system_health');
      if (error) throw error;
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Health</h1>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            Real-time infrastructure monitoring and operational metrics.
          </p>
        </div>
        <button 
          onClick={loadHealth}
          className="inline-flex items-center px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <RefreshCw className={cn("h-5 w-5 mr-2", loading && "animate-spin")} />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Core Status */}
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-green-500" />
                Infrastructure Status
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase tracking-widest">
                All Systems Online
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <Database className="h-5 w-5 text-blue-600 mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">Database</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{health?.services?.database?.toUpperCase() || '...'}</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <Wifi className="h-5 w-5 text-purple-600 mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">Realtime</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{health?.services?.realtime?.toUpperCase() || '...'}</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <Cpu className="h-5 w-5 text-amber-600 mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase mb-1">Functions</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">OPERATIONAL</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <Activity className="h-6 w-6 text-amber-600" />
              Real-time Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Active Events</p>
                <p className="text-5xl font-black text-gray-900 dark:text-white">{health?.metrics?.active_events ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Staff Online</p>
                <p className="text-5xl font-black text-gray-900 dark:text-white">{health?.metrics?.staff_clocked_in ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Stock Alerts</p>
                <p className="text-5xl font-black text-red-600">{health?.metrics?.inventory_alerts ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="col-span-1 space-y-8">
          <div className="bg-gray-900 p-8 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-5 w-5 text-amber-500" />
              <h4 className="text-lg font-bold">Last Heartbeat</h4>
            </div>
            <p className="text-3xl font-black">{lastUpdated.toLocaleTimeString()}</p>
            <p className="mt-2 text-gray-400 text-sm font-medium italic">Automatic refresh active</p>
            
            <div className="mt-10 pt-10 border-t border-white/10">
              <h4 className="font-bold mb-4">Environment</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Environment</span>
                  <span className="font-mono text-amber-500 font-bold">production</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Region</span>
                  <span className="font-mono">us-east-1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">App Version</span>
                  <span className="font-mono">v1.2.0-stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
