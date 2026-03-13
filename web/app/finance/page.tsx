"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { 
  getLedgerAccounts, 
  getLedgerEntries, 
  postLedgerTransaction 
} from "@/lib/services";
import { LoadingSpinner } from "@/components/loading-spinner";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  BookOpen,
  AlertCircle
} from "lucide-react";
import { Modal } from "@/components/modal";

export default function FinancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Transaction Form State
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    { account_id: "", debit: "0.00", credit: "0.00" },
    { account_id: "", debit: "0.00", credit: "0.00" },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [accs, ents] = await Promise.all([
        getLedgerAccounts(),
        getLedgerEntries()
      ]);
      setAccounts(accs);
      setEntries(ents);
    } catch (err) {
      setError("Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate balance
    const totalDebit = lines.reduce((sum, l) => sum + parseFloat(l.debit || "0"), 0);
    const totalCredit = lines.reduce((sum, l) => sum + parseFloat(l.credit || "0"), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      setError(`Transaction is unbalanced. Debits: ${totalDebit.toFixed(2)}, Credits: ${totalCredit.toFixed(2)}`);
      return;
    }

    try {
      await postLedgerTransaction({
        description,
        lines: lines.filter(l => parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)
      });
      setIsModalOpen(false);
      setDescription("");
      setLines([
        { account_id: "", debit: "0.00", credit: "0.00" },
        { account_id: "", debit: "0.00", credit: "0.00" },
      ]);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to post transaction");
    }
  }

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance & Ledger</h1>
            <p className="text-gray-500">Manage your chart of accounts and journal entries</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Journal Entry
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400 w-5 h-5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart of Accounts */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold text-gray-700">Chart of Accounts</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {accounts.map(account => (
                  <div key={account.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="text-xs font-mono text-gray-400 block">{account.code}</span>
                      <span className="font-medium text-gray-800">{account.name}</span>
                    </div>
                    <span className="text-xs uppercase px-2 py-1 bg-gray-100 rounded text-gray-500 font-semibold">
                      {account.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold text-gray-700">Recent Journal Entries</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {entries.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{entry.description}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 font-mono mr-2">{entry.account?.code}</span>
                          {entry.account?.name}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          {parseFloat(entry.debit) > 0 ? `$${entry.debit}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">
                          {parseFloat(entry.credit) > 0 ? `$${entry.credit}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* New Entry Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="New Journal Entry"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g., Office Supplies Purchase"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase px-1">
                <div className="col-span-6">Account</div>
                <div className="col-span-3 text-right">Debit</div>
                <div className="col-span-3 text-right">Credit</div>
              </div>

              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <select
                      required
                      value={line.account_id}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].account_id = e.target.value;
                        setLines(newLines);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      <option value="">Select Account...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].debit = e.target.value;
                        setLines(newLines);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-right"
                    />
                  </div>
                  <div className="col-span-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].credit = e.target.value;
                        setLines(newLines);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLines([...lines, { account_id: "", debit: "0.00", credit: "0.00" }])}
              className="text-amber-600 text-sm font-medium hover:text-amber-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Line
            </button>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Post Transaction
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
