"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { getInvoices, getEvents, generateInvoiceForEvent, getInvoiceItems, type Invoice } from "@/lib/supabase-services";
import { FileText, Plus, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-generator";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, eventsData] = await Promise.all([
        getInvoices(),
        getEvents()
      ]);
      setInvoices(invoicesData);
      setEvents(eventsData.filter((e: any) => e.status === 'completed'));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedEventId) return;
    
    setGenerating(true);
    try {
      await generateInvoiceForEvent(selectedEventId);
      await loadData();
      setShowGenerateModal(false);
      setSelectedEventId("");
      alert("Invoice generated successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    setDownloading(invoice.id);
    try {
      const items = await getInvoiceItems(invoice.id);
      await generateInvoicePDF(invoice, items);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download invoice PDF");
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Generate and manage event invoices</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Generate Invoice
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Invoices</h3>
              <p className="mt-2 text-gray-600">
                Generate your first invoice for a completed event.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">{invoice.client_name || "Unknown Client"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">${invoice.total_amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <span>Labor: ${invoice.labor_costs_total.toLocaleString()}</span>
                        <span className="ml-4">Tax: ${invoice.tax_amount.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={downloading === invoice.id}
                        className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {downloading === invoice.id ? "Downloading..." : "Download"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate Invoice
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Completed Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.event_name} - {new Date(event.event_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedEventId("");
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={!selectedEventId || generating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
