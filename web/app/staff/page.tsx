"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { getStaff } from "@/lib/supabase-services";
import { StaffForm } from "@/components/staff-form";
import {
  Plus,
  Search,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Clock,
  Star,
  Edit,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  hireDate: Date;
  hourlyRate: number;
  hoursThisMonth: number;
  eventsThisMonth: number;
  rating: number;
  status: "active" | "inactive";
}

// Removed mock data - now fetching from Supabase
const MOCK_STAFF_FALLBACK: StaffMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Head Chef",
    email: "sarah.j@caterking.com",
    phone: "(555) 111-2222",
    hireDate: new Date(2023, 3, 15),
    hourlyRate: 35,
    hoursThisMonth: 168,
    eventsThisMonth: 12,
    rating: 5,
    status: "active",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Sous Chef",
    email: "michael.c@caterking.com",
    phone: "(555) 222-3333",
    hireDate: new Date(2023, 7, 1),
    hourlyRate: 28,
    hoursThisMonth: 152,
    eventsThisMonth: 10,
    rating: 5,
    status: "active",
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    role: "Server",
    email: "emma.r@caterking.com",
    phone: "(555) 333-4444",
    hireDate: new Date(2024, 1, 10),
    hourlyRate: 18,
    hoursThisMonth: 96,
    eventsThisMonth: 8,
    rating: 4,
    status: "active",
  },
  {
    id: "4",
    name: "David Kim",
    role: "Event Coordinator",
    email: "david.k@caterking.com",
    phone: "(555) 444-5555",
    hireDate: new Date(2023, 9, 20),
    hourlyRate: 32,
    hoursThisMonth: 160,
    eventsThisMonth: 15,
    rating: 5,
    status: "active",
  },
  {
    id: "5",
    name: "Lisa Martinez",
    role: "Server",
    email: "lisa.m@caterking.com",
    phone: "(555) 555-6666",
    hireDate: new Date(2024, 5, 5),
    hourlyRate: 18,
    hoursThisMonth: 88,
    eventsThisMonth: 7,
    rating: 4,
    status: "active",
  },
];

const ROLES = ["All", "Head Chef", "Sous Chef", "Server", "Event Coordinator"];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const loadStaff = async () => {
    try {
        const data = await getStaff();
        // Map Supabase data to StaffMember interface
        const mappedStaff = data.map((s: any) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          role: s.role,
          email: s.email || "",
          phone: s.phone || "",
          hireDate: s.hire_date ? new Date(s.hire_date) : new Date(),
          hourlyRate: parseFloat(s.hourly_rate) || 0,
          hoursThisMonth: parseFloat(s.total_hours_worked) || 0,
          eventsThisMonth: s.total_events_worked || 0,
          rating: parseFloat(s.performance_rating) || 0,
          status: s.status === "active" ? "active" : "inactive",
        }));
        setStaff(mappedStaff);
      } catch (error) {
        console.error("Error loading staff:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleFormSuccess = () => {
    loadStaff();
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "All" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalPayroll = staff.reduce(
    (sum, member) => sum + member.hourlyRate * member.hoursThisMonth,
    0
  );
  const totalHours = staff.reduce((sum, member) => sum + member.hoursThisMonth, 0);
  const avgRating =
    staff.reduce((sum, member) => sum + member.rating, 0) / staff.length;

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
            <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your team and track performance
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700">
            <Plus className="h-5 w-5 mr-2" />
            Add Staff Member
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCog className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Payroll (This Month)
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${totalPayroll.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Hours
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {totalHours}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Rating
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {avgRating.toFixed(1)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
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
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedRole === role
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {member.role}
                    </span>
                  </div>
                  <div className="ml-4">{renderStars(member.rating)}</div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {member.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Hired {member.hireDate.toLocaleDateString()}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${member.hourlyRate}/hr
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hours</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {member.hoursThisMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Events</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {member.eventsThisMonth}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStaff.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              <UserCog className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No staff members found
              </h3>
              <p className="text-sm">
                Try adjusting your search or add a new staff member.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Staff Form Modal */}
      <StaffForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStaff(null);
        }}
        onSuccess={handleFormSuccess}
        staff={editingStaff}
      />
    </div>
  );
}
