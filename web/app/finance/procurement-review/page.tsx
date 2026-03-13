"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { getPendingProcurementTransactions, finalizeProcurementTransaction } from "@/shared/procurement-ledger-service";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { 
  Banknote, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProcurementReviewPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPendingProcurementTransactions(supabase);
      
      // Group by transaction_id
      const grouped = data.reduce((acc: any, curr: any) => {
        if (!acc[curr.transaction_id]) {
          acc[curr.transaction_id] = {
            id: curr.transaction_id,
            description: curr.description,
            date: curr.created_at,
            reference_id: curr.reference_id,
            entries: []
          };
        }
        acc[curr.transaction_id].entries.push(curr);
        return acc;
      }, {});

      setTransactions(Object.values(grouped));
    } catch (error) {
      console.error("Error loading review data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (txnId: string) => {
    if (!user) return;
    setProcessing(txnId);
    try {
      await finalizeProcurementTransaction(supabase, txnId, user.id);
      await loadData();
    } catch (error) {
      console.error("Posting failed:", error);
      alert("Failed to post transaction");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Finance Review</h1>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest">
            Audit Queue
          </span>
        </div>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Review and post draft transactions from procurement operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading audit queue...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-16 text-center shadow-sm">
            <div className="h-20 w-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Queue Clear</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">No pending procurement transactions require review at this time.</p>
          </div>
        ) : (
          transactions.map((txn) => (
            <div key={txn.id} className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Banknote className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{txn.description}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(txn.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        Ref: #{txn.reference_id?.slice(0,8)}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handlePost(txn.id)}
                  disabled={!!processing}
                  className="inline-flex items-center px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all gap-2"
                >
                  {processing === txn.id ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <CheckCircle2 className="h-4 w-4" />}
                  Audit & Post to Ledger
                </button>
              </div>

              <div className="p-0">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-800">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Account</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Debit</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txn.entries.map((entry: any) => (
                      <tr key={entry.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.ledger_accounts?.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{entry.ledger_accounts?.code}</p>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className={cn("text-sm font-extrabold", parseFloat(entry.debit) > 0 ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-700")}>
                            {parseFloat(entry.debit) > 0 ? `$${parseFloat(entry.debit).toLocaleString()}` : '-'}
                          </p>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className={cn("text-sm font-extrabold", parseFloat(entry.credit) > 0 ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-700")}>
                            {parseFloat(entry.credit) > 0 ? `$${parseFloat(entry.credit).toLocaleString()}` : '-'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex items-center justify-center gap-3">
        <AlertCircle className="h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-500">Posting to the ledger is immutable and will affect financial statements immediately.</p>
      </div>
    </DashboardLayout>
  );
}
