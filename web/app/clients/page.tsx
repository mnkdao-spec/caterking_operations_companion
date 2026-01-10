"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { getClients } from "@/lib/supabase-services";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  Star,
  MessageSquare,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: "Corporate" | "Wedding" | "Private";
  email: string;
  phone: string;
  company?: string;
  totalEvents: number;
  lifetimeValue: number;
  lastEvent: Date;
  satisfaction: number;
  notes: string;
}

// Removed mock data - now fetching from Supabase
const MOCK_CLIENTS_FALLBACK: Client[] = [
  {
    id: "1",
    name: "Acme Corporation",
    type: "Corporate",
    email: "events@acmecorp.com",
    phone: "(555) 123-4567",
    company: "Acme Corp",
    totalEvents: 12,
    lifetimeValue: 145000,
    lastEvent: new Date(2026, 0, 15),
    satisfaction: 5,
    notes: "Prefers vegetarian options, always books 6 months in advance",
  },
  {
    id: "2",
    name: "Emily Smith",
    type: "Wedding",
    email: "emily.smith@email.com",
    phone: "(555) 234-5678",
    totalEvents: 1,
    lifetimeValue: 28000,
    lastEvent: new Date(2026, 0, 22),
    satisfaction: 5,
    notes: "Gluten-free requirements for bride's family",
  },
  {
    id: "3",
    name: "TechStart Inc",
    type: "Corporate",
    email: "admin@techstart.io",
    phone: "(555) 345-6789",
    company: "TechStart",
    totalEvents: 8,
    lifetimeValue: 98000,
    lastEvent: new Date(2026, 0, 18),
    satisfaction: 4,
    notes: "Tech-focused events, likes modern presentation",
  },
  {
    id: "4",
    name: "Michael Chen",
    type: "Private",
    email: "mchen@email.com",
    phone: "(555) 456-7890",
    totalEvents: 3,
    lifetimeValue: 24000,
    lastEvent: new Date(2026, 0, 25),
    satisfaction: 5,
    notes: "Regular client for family celebrations",
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await getClients();
        // Map Supabase data to Client interface
        const mappedClients = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.client_type === "corporate" ? "Corporate" : c.client_type === "individual" ? "Private" : "Wedding",
          email: c.email || "",
          phone: c.phone || "",
          company: c.company,
          totalEvents: c.total_events || 0,
          lifetimeValue: parseFloat(c.lifetime_value) || 0,
          lastEvent: new Date(), // TODO: get from client_events table
          satisfaction: c.satisfaction_rating || 0,
          notes: c.notes || "",
        }));
        setClients(mappedClients);
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = filterType === "all" || client.type === filterType;
    return matchesSearch && matchesType;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your client relationships and history
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
            <Plus className="h-5 w-5 mr-2" />
            New Client
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Corporate">Corporate</option>
            <option value="Wedding">Wedding</option>
            <option value="Private">Private</option>
          </select>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {client.name}
                    </h3>
                    {client.company && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Building2 className="h-4 w-4 mr-1" />
                        {client.company}
                      </div>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {client.type}
                    </span>
                  </div>
                  <div className="ml-4">
                    {renderStars(client.satisfaction)}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {client.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {client.phone}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Events</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {client.totalEvents}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Lifetime Value</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${(client.lifetimeValue / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Event</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.lastEvent.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {client.notes && (
                  <div className="mt-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {client.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </button>
                  <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Calendar className="h-4 w-4 mr-1" />
                    Book Event
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No clients found
              </h3>
              <p className="text-sm">
                Try adjusting your search or add a new client.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
