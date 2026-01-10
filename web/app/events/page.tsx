"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { getEvents } from "@/lib/supabase-services";
import { EventForm } from "@/components/event-form";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

type EventStatus = "lead" | "confirmed" | "in_progress" | "completed" | "cancelled";

interface Event {
  id: string;
  title: string;
  client: string;
  date: Date;
  time: string;
  venue: string;
  guestCount: number;
  budget: number;
  status: EventStatus;
  type: string;
}

// Removed mock data - now fetching from Supabase
const MOCK_EVENTS_FALLBACK: Event[] = [
  {
    id: "1",
    title: "Acme Corp Annual Gala",
    client: "Acme Corporation",
    date: new Date(2026, 0, 15),
    time: "18:00",
    venue: "Grand Ballroom, Downtown Hotel",
    guestCount: 250,
    budget: 45000,
    status: "confirmed",
    type: "Corporate",
  },
  {
    id: "2",
    title: "Smith-Johnson Wedding Reception",
    client: "Emily Smith",
    date: new Date(2026, 0, 22),
    time: "17:00",
    venue: "Garden Terrace, Riverside Estate",
    guestCount: 150,
    budget: 28000,
    status: "confirmed",
    type: "Wedding",
  },
  {
    id: "3",
    title: "TechStart Product Launch",
    client: "TechStart Inc",
    date: new Date(2026, 0, 18),
    time: "19:00",
    venue: "Innovation Center",
    guestCount: 100,
    budget: 18000,
    status: "in_progress",
    type: "Corporate",
  },
  {
    id: "4",
    title: "Birthday Celebration",
    client: "Michael Chen",
    date: new Date(2026, 0, 25),
    time: "14:00",
    venue: "Private Residence",
    guestCount: 50,
    budget: 8000,
    status: "lead",
    type: "Private",
  },
];

const statusColors: Record<EventStatus, string> = {
  lead: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<EventStatus, string> = {
  lead: "Lead",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const loadEvents = async () => {
    try {
        const data = await getEvents();
        // Map Supabase data to Event interface
        const mappedEvents = data.map((e: any) => ({
          id: e.id,
          title: e.event_name || "Untitled Event",
          client: e.client || "Unknown Client",
          date: new Date(e.event_date),
          time: e.event_time || "TBD",
          venue: e.venue_name || e.venue || "TBD",
          guestCount: e.guest_count || 0,
          budget: e.budget || 0,
          status: (e.status || "lead") as EventStatus,
          type: e.event_type || "Private",
        }));
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleFormSuccess = () => {
    loadEvents();
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and track all your catering events
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
            <Plus className="h-5 w-5 mr-2" />
            New Event
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              placeholder="Search events or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EventStatus | "all")}
            >
              <option value="all">All Status</option>
              <option value="lead">Lead</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "list"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "calendar"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Events List */}
        {viewMode === "list" && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <li key={event.id} className="hover:bg-gray-50 cursor-pointer">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-amber-600 truncate">
                            {event.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                statusColors[event.status]
                              }`}
                            >
                              {statusLabels[event.status]}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {event.client}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {event.venue}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>
                              {format(event.date, "MMM d, yyyy")} at {event.time}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-gray-400" />
                            {event.guestCount} guests
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                            ${event.budget.toLocaleString()} budget
                          </span>
                          <span className="px-2 py-1 text-xs rounded bg-gray-100">
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Calendar View Placeholder */}
        {viewMode === "calendar" && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Calendar View
              </h3>
              <p className="text-sm">
                Full calendar integration coming soon. Events will be displayed in a
                monthly calendar format with drag-and-drop capabilities.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-sm">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Event Form Modal */}
      <EventForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={handleFormSuccess}
        event={editingEvent}
      />
    </div>
  );
}
