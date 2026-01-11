'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getInvoiceTemplates,
  getInvoiceTemplatesByClient,
  deleteInvoiceTemplate,
  getClients,
  type InvoiceTemplate,
} from '@/lib/supabase-services';

export default function InvoiceTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterClientId, setFilterClientId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, clientsData] = await Promise.all([
        getInvoiceTemplates(),
        getClients(),
      ]);
      setTemplates(templatesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteInvoiceTemplate(id);
        setTemplates(templates.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowModal(true);
  };

  const filteredTemplates = filterClientId
    ? templates.filter(t => t.client_id === filterClientId)
    : templates;

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annually: 'Annually',
    };
    return labels[frequency] || frequency;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Templates</h1>
            <p className="text-gray-600 mt-2">Create and manage recurring invoice templates for regular clients</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + New Template
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No invoice templates found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{template.template_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        template.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">Client: {getClientName(template.client_id)}</p>
                    {template.description && (
                      <p className="text-gray-600 mt-1">{template.description}</p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm text-gray-600">
                      <span>Frequency: {getFrequencyLabel(template.frequency)}</span>
                      <span>Next: {new Date(template.next_generation_date).toLocaleDateString()}</span>
                      {template.last_generated_date && (
                        <span>Last: {new Date(template.last_generated_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <p className="text-gray-600 mb-6">
                {selectedTemplate 
                  ? 'Update the template details and items'
                  : 'Set up a new recurring invoice template for automatic generation'}
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-6">
                Template management UI coming soon. Use the Invoices page to view generated invoices.
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
