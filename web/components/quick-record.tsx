"use client";

import { useState } from "react";
import { accountingService, type FinancialCategory } from "@/lib/accounting-service";
import { Plus, Receipt, DollarSign, X, Check } from "lucide-react";

interface QuickRecordProps {
  onSuccess?: () => void;
}

export function QuickRecord({ onSuccess }: QuickRecordProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "food_cost" as FinancialCategory,
    date: new Date().toISOString().split("T")[0],
    vendor: "",
  });

  const categories: { value: FinancialCategory; label: string }[] = [
    { value: "food_cost", label: "Inventory / Food" },
    { value: "labor", label: "Labor / Payroll" },
    { value: "licensing", label: "Licensing / Permits" },
    { value: "equipment", label: "Equipment / Tools" },
    { value: "utility", label: "Utilities" },
    { value: "marketing", label: "Marketing" },
    { value: "rent", label: "Rent" },
    { value: "insurance", label: "Insurance" },
    { value: "sales", label: "Sales (Income)" },
    { value: "other", label: "Other" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) throw new Error("Invalid amount");

      if (type === "expense") {
        await accountingService.createVendorBill({
          vendor_name: formData.vendor || "Misc Vendor",
          amount: amount,
          category: formData.category,
          due_date: formData.date,
          notes: formData.description
        });
        // Note: For now, we'll assume quick-record expenses are paid immediately
        // In a real flow, you might mark it 'pending'
      } else {
        await accountingService.createPayment({
          amount: amount,
          payment_date: formData.date,
          description: formData.description,
          method: "credit_card" // Default for quick record
        });
      }

      setIsOpen(false);
      setFormData({
        amount: "",
        description: "",
        category: "food_cost",
        date: new Date().toISOString().split("T")[0],
        vendor: "",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to record:", error);
      alert("Error saving record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Quick Record</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">New Transaction</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    type === "expense" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
                  }`}
                >
                  <Receipt className="h-4 w-4" /> Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    type === "income" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
                  }`}
                >
                  <DollarSign className="h-4 w-4" /> Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Total Amount (Incl. HST)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl text-2xl font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Vendor / Description */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                  {type === "expense" ? "Vendor / Supplier" : "Description"}
                </label>
                <input
                  required
                  type="text"
                  placeholder={type === "expense" ? "e.g. Sysco, GFL, LCBO" : "e.g. Event Deposit, Cash Sale"}
                  value={type === "expense" ? formData.vendor : formData.description}
                  onChange={e => setFormData({...formData, [type === "expense" ? 'vendor' : 'description']: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as FinancialCategory})}
                    className="w-full px-3 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                  type === "expense" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                } disabled:opacity-50`}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Record {type.charAt(0).toUpperCase() + type.slice(1)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
