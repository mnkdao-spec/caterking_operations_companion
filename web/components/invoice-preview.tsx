"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Modal } from "./modal";
import { InvoicePDF } from "./invoice-pdf";
import { Loader2, Plus, Trash2, Send, CheckCircle, Clock, Mail } from "lucide-react";
import { createInvoiceItem, deleteInvoiceItem, updateInvoiceStatus, getInvoiceDetails } from "@/lib/supabase-services";
import { accountingService } from "@/lib/accounting-service";

// PDFViewer must be client-side only
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-lg"><Loader2 className="animate-spin h-8 w-8 text-amber-600" /></div> }
);

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoice: any;
    items: any[];
    client: any;
  } | null;
  onRefresh: () => void;
}

export function InvoicePreview({ isOpen, onClose, invoiceData, onRefresh }: InvoicePreviewProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unit_price: 0, category: "other" });
  const [localInvoiceData, setLocalInvoiceData] = useState(invoiceData);

  // Sync internal state when prop changes
  if (invoiceData && localInvoiceData?.invoice.id !== invoiceData.invoice.id) {
    setLocalInvoiceData(invoiceData);
  }

  if (!localInvoiceData) return null;

  const { invoice, items, client } = localInvoiceData;

  const refreshLocalData = async () => {
    const fresh = await getInvoiceDetails(invoice.id);
    setLocalInvoiceData(fresh);
    onRefresh();
  };

  const handleSendEmail = async () => {
    if (!client?.email) {
      alert("Error: Client has no email address on file.");
      return;
    }

    if (!confirm(`Send invoice ${invoice.invoice_number} to ${client.email}?`)) return;

    setSendingEmail(true);
    try {
      await accountingService.sendInvoiceEmail({ invoice, client, items });
      await updateInvoiceStatus(invoice.id, 'sent');
      await refreshLocalData();
      alert("Email sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send email. Check your RESEND_API_KEY.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoiceItem({
        invoice_id: invoice.id,
        ...newItem,
        total_price: newItem.quantity * newItem.unit_price
      });
      setNewItem({ description: "", quantity: 1, unit_price: 0, category: "other" });
      setAddingItem(false);
      await refreshLocalData();
    } catch (err) {
      alert("Failed to add item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Remove this line item?")) return;
    try {
      await deleteInvoiceItem(id);
      await refreshLocalData();
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      await refreshLocalData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Professional Invoice: ${invoice.invoice_number}`}
      size="xl"
    >
      <div className="flex gap-6 h-[800px]">
        {/* Left Side: PDF Preview */}
        <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-inner">
          <PDFViewer width="100%" height="100%" className="border-none">
            <InvoicePDF invoice={invoice} items={items} client={client} />
          </PDFViewer>
        </div>

        {/* Right Side: Controls & Editor */}
        <div className="w-[400px] flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Main Action: Send Email */}
          <button 
            onClick={handleSendEmail}
            disabled={sendingEmail || invoice.status === 'paid'}
            className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingEmail ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mail className="h-6 w-6" />}
            {invoice.status === 'draft' ? 'Email to Client' : 'Resend Invoice'}
          </button>

          {/* Status Workflow */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Workflow</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleStatusChange('sent')}
                disabled={invoice.status === 'paid'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  invoice.status === 'sent' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'
                }`}
              >
                <Send className="h-3 w-3" /> Mark Sent
              </button>
              <button 
                onClick={() => handleStatusChange('paid')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  invoice.status === 'paid' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border border-green-100 hover:bg-green-50'
                }`}
              >
                <CheckCircle className="h-3 w-3" /> Mark Paid
              </button>
              <button 
                onClick={() => handleStatusChange('overdue')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  invoice.status === 'overdue' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'
                }`}
              >
                <Clock className="h-3 w-3" /> Overdue
              </button>
            </div>
            {invoice.status === 'paid' && (
              <p className="mt-3 text-[10px] text-green-600 font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Ledger synced automatically.
              </p>
            )}
          </div>

          {/* Line Item Editor */}
          <div className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Line Items</h4>
              <button 
                onClick={() => setAddingItem(!addingItem)}
                className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            {addingItem && (
              <form onSubmit={handleAddItem} className="mb-6 p-4 bg-amber-50 rounded-xl space-y-3 border border-amber-100 animate-in slide-in-from-top-2 duration-200">
                <input 
                  required
                  placeholder="Item description"
                  className="w-full px-3 py-2 rounded-lg border-none text-sm focus:ring-2 focus:ring-amber-500"
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                />
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="Qty"
                    className="w-20 px-3 py-2 rounded-lg border-none text-sm focus:ring-2 focus:ring-amber-500"
                    value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                  />
                  <input 
                    type="number"
                    placeholder="Price"
                    className="flex-1 px-3 py-2 rounded-lg border-none text-sm focus:ring-2 focus:ring-amber-500"
                    value={newItem.unit_price}
                    onChange={e => setNewItem({...newItem, unit_price: parseFloat(e.target.value)})}
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-amber-700 transition-all">
                  Save Item
                </button>
              </form>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="group flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.description}</p>
                    <p className="text-[10px] text-gray-500">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black text-gray-900">${Number(item.total_price).toFixed(2)}</p>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-bold">${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">HST (13%):</span>
                <span className="font-bold text-blue-600">${Number(invoice.tax_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg mt-3 pt-3 border-t border-gray-100">
                <span className="font-black text-gray-900">Total:</span>
                <span className="font-black text-amber-600">${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

