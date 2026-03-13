"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { QuickRecord } from "@/components/quick-record";
import { accountingService, type LedgerEntry, type TaxSummary } from "@/lib/accounting-service";
import { 
  DollarSign, 
  Receipt, 
  TrendingDown, 
  TrendingUp, 
  FileText,
  Calculator,
  AlertTriangle
} from "lucide-react";

export default function AccountingDashboard() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");

  useEffect(() => {
    loadAccountingData();
  }, [period]);

  const [remittance, setRemittance] = useState({ hst: 0, cpp: 0, ei: 0 });

  async function loadAccountingData() {
    setLoading(true);
    try {
      const now = new Date();
      let start = new Date(now.getFullYear(), now.getMonth(), 1);
      
      if (period === "this_quarter") {
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
      }

      const [ledgerData, summaryData] = await Promise.all([
        accountingService.getLedger({ startDate: start.toISOString() }),
        accountingService.getTaxSummary(start.toISOString(), now.toISOString())
      ]);

      setLedger(ledgerData);
      setTaxSummary(summaryData);

      // Calculate Payroll Tax Remittance from Ledger
      const payrollTaxes = ledgerData.reduce((acc, entry) => {
        if (entry.description.includes("CPP")) acc.cpp += Math.abs(entry.amount);
        if (entry.description.includes("EI")) acc.ei += Math.abs(entry.amount);
        return acc;
      }, { cpp: 0, ei: 0 });

      setRemittance({
        hst: summaryData?.net_hst_remittance || 0,
        cpp: payrollTaxes.cpp,
        ei: payrollTaxes.ei
      });

    } catch (error) {
      console.error("Error loading accounting data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Hub</h1>
            <p className="text-gray-600 mt-1">Canadian & Ontario Business Compliance</p>
          </div>
          <div className="flex gap-2">
            <QuickRecord onSuccess={loadAccountingData} />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-amber-500"
            >
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="ytd">Year to Date (Fiscal)</option>
            </select>
            <button className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2">
              <FileText className="h-4 w-4" /> Export CRA Report
            </button>
          </div>
        </div>

        {/* HST Compliance Card (Ontario 13%) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border-l-4 border-blue-600 shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="text-blue-600" /> HST Summary (Ontario - 13%)
              </h2>
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">CRA Compliant</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500">HST Collected (Sales)</p>
                <p className="text-2xl font-bold text-gray-900">${taxSummary?.hst_collected.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">HST Paid (ITCs)</p>
                <p className="text-2xl font-bold text-gray-900">${taxSummary?.hst_paid_itc.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 shadow-xl rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black tracking-tighter flex items-center gap-2">
                  <Building2 className="text-amber-500" /> Receiver General Obligations
                </h2>
                <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-1 rounded-full uppercase">Payment Required</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">HST Net</p>
                  <p className="text-lg font-black">${remittance.hst.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">CPP (Total)</p>
                  <p className="text-lg font-black">${remittance.cpp.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">EI (Total)</p>
                  <p className="text-lg font-black">${remittance.ei.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Total Remittance Owed</p>
                  <p className="text-4xl font-black">${(remittance.hst + remittance.cpp + remittance.ei).toFixed(2)}</p>
                </div>
                <Calculator className="h-10 w-10 text-white/10" />
              </div>
            </div>
            {/* Background Branding Elements */}
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Building2 className="h-32 w-32" />
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Central Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category (CRA)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">HST</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions recorded for this period.</td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entry.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 uppercase">
                          {entry.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        ${(entry.amount - (entry.tax_amount || 0)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                        ${(entry.tax_amount || 0).toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        ${entry.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ontario Labor Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 h-5 w-5 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Employment Standards Act (Ontario) Reminder</h4>
            <p className="text-xs text-amber-800 mt-1">
              Ensure all staff assignments match actual hours worked for payroll accuracy. 
              Automated T4/T4A summaries will be generated based on the "Labor" category in the ledger.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
