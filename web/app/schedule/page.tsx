"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { getEvents, getStaff, getStaffAssignments, createStaffAssignment, deleteStaffAssignment, checkStaffConflicts, type StaffConflict } from "@/lib/supabase-services";
import { Calendar, Users, Clock, DollarSign, Plus, X, AlertCircle } from "lucide-react";

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  guest_count: number;
  status: string;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  hourly_rate: number;
  status: string;
  department: string;
}

interface StaffAssignment {
  id: string;
  staff_id: string;
  event_id: string;
  role: string;
  hours_worked: number;
  pay_amount: number;
  staff?: StaffMember;
  event?: Event;
}

export default function SchedulePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [assignmentRole, setAssignmentRole] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("8");
  const [conflicts, setConflicts] = useState<StaffConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [eventsData, staffData, assignmentsData] = await Promise.all([
        getEvents(),
        getStaff(),
        getStaffAssignments(),
      ]);

      // Filter upcoming and confirmed events
      const upcomingEvents = eventsData.filter((e: Event) => {
        const eventDate = new Date(e.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today && e.status === "confirmed";
      });

      setEvents(upcomingEvents);
      setStaff(staffData.filter((s: StaffMember) => s.status === "active"));
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error loading schedule data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getEventAssignments(eventId: string) {
    return assignments.filter((a) => a.event_id === eventId);
  }

  function getStaffName(staffId: string) {
    const staffMember = staff.find((s) => s.id === staffId);
    return staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : "Unknown";
  }

  function getStaffRole(staffId: string) {
    const staffMember = staff.find((s) => s.id === staffId);
    return staffMember?.role || "";
  }

  function getStaffRate(staffId: string) {
    const staffMember = staff.find((s) => s.id === staffId);
    return staffMember?.hourly_rate || 0;
  }

  async function checkForConflicts() {
    if (!selectedEvent || !selectedStaff) {
      setConflicts([]);
      return;
    }

    setCheckingConflicts(true);
    try {
      // Extract date and time from event
      const eventDate = selectedEvent.event_date; // Already in YYYY-MM-DD format
      const eventTime = selectedEvent.event_time; // Already in HH:MM:SS format

      console.log('Checking conflicts for:', {
        staffId: selectedStaff,
        eventId: selectedEvent.id,
        eventDate,
        eventTime
      });

      const conflictData = await checkStaffConflicts(
        selectedStaff,
        selectedEvent.id,
        eventDate,
        eventTime
      );

      console.log('Conflict check result:', conflictData);
      setConflicts(conflictData);
    } catch (error) {
      console.error("Error checking conflicts:", error);
      setConflicts([]);
    } finally {
      setCheckingConflicts(false);
    }
  }

  useEffect(() => {
    checkForConflicts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaff, selectedEvent?.id, estimatedHours]);

  async function handleAssignStaff() {
    if (!selectedEvent || !selectedStaff || !assignmentRole) {
      alert("Please select staff and specify role");
      return;
    }

    // Prevent assignment if there are conflicts
    if (conflicts.length > 0) {
      const confirmAssign = confirm(
        `WARNING: This staff member has ${conflicts.length} conflict(s). Do you want to proceed anyway?\n\n` +
        conflicts.map(c => `- ${c.conflict_type}: ${c.conflict_details}`).join('\n')
      );
      if (!confirmAssign) {
        return;
      }
    }

    const hours = parseFloat(estimatedHours) || 8;
    const rate = getStaffRate(selectedStaff);
    const payAmount = hours * rate;

    try {
      await createStaffAssignment({
        staff_id: selectedStaff,
        event_id: selectedEvent.id,
        role: assignmentRole,
        hours_worked: hours,
        pay_amount: payAmount,
      });

      await loadData();
      setShowAssignModal(false);
      setSelectedStaff("");
      setAssignmentRole("");
      setEstimatedHours("8");
      setConflicts([]);
    } catch (error) {
      console.error("Error assigning staff:", error);
      alert("Failed to assign staff");
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    if (!confirm("Remove this staff assignment?")) return;

    try {
      await deleteStaffAssignment(assignmentId);
      await loadData();
    } catch (error) {
      console.error("Error removing assignment:", error);
      alert("Failed to remove assignment");
    }
  }

  function calculateEventTotals(eventId: string) {
    const eventAssignments = getEventAssignments(eventId);
    const totalHours = eventAssignments.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
    const totalPay = eventAssignments.reduce((sum, a) => sum + (a.pay_amount || 0), 0);
    return { totalHours, totalPay, staffCount: eventAssignments.length };
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading schedule...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Scheduling</h1>
            <p className="text-gray-600 mt-1">Assign staff to upcoming events</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{events.length}</span> upcoming events
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{staff.length}</span> active staff
            </div>
          </div>
        </div>

        {/* Events List with Assignments */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Upcoming Events</h3>
              <p className="mt-2 text-gray-600">
                No confirmed events scheduled. Create events to start scheduling staff.
              </p>
            </div>
          ) : (
            events.map((event) => {
              const eventAssignments = getEventAssignments(event.id);
              const totals = calculateEventTotals(event.id);
              const eventDate = new Date(event.event_date);
              const isToday = eventDate.toDateString() === new Date().toDateString();
              const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Event Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">{event.event_name}</h3>
                          {isToday && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              TODAY
                            </span>
                          )}
                          {daysUntil > 0 && daysUntil <= 3 && !isToday && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                              {daysUntil} days
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {eventDate.toLocaleDateString()} at {event.event_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.guest_count} guests
                          </div>
                          <div>{event.venue_name}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowAssignModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Assign Staff
                      </button>
                    </div>

                    {/* Event Totals */}
                    <div className="mt-4 flex gap-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{totals.staffCount}</span>
                        <span className="text-gray-600">staff assigned</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{totals.totalHours.toFixed(1)}</span>
                        <span className="text-gray-600">total hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">${totals.totalPay.toFixed(2)}</span>
                        <span className="text-gray-600">labor cost</span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Assignments */}
                  <div className="p-6">
                    {eventAssignments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p>No staff assigned yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {getStaffName(assignment.staff_id)}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{assignment.role}</p>
                                <div className="mt-3 space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {assignment.hours_worked || 0} hours
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" />
                                    ${(assignment.pay_amount || 0).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Assign Staff Modal */}
      {showAssignModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Assign Staff to Event</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedEvent.event_name}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Staff Member
                </label>
                <select
                  value={selectedStaff}
                  onChange={async (e) => {
                    const staffId = e.target.value;
                    setSelectedStaff(staffId);
                    const staffMember = staff.find((s) => s.id === staffId);
                    if (staffMember) {
                      setAssignmentRole(staffMember.role);
                    }
                    // Trigger conflict check immediately
                    if (staffId && selectedEvent) {
                      setCheckingConflicts(true);
                      try {
                        const eventDate = selectedEvent.event_date;
                        const eventTime = selectedEvent.event_time;
                        const conflictData = await checkStaffConflicts(
                          staffId,
                          selectedEvent.id,
                          eventDate,
                          eventTime
                        );
                        setConflicts(conflictData);
                      } catch (error) {
                        console.error("Error checking conflicts:", error);
                        setConflicts([]);
                      } finally {
                        setCheckingConflicts(false);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose staff...</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} - {s.role} (${s.hourly_rate}/hr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role for This Event
                </label>
                <input
                  type="text"
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                  placeholder="e.g., Head Chef, Server, Bartender"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  step="0.5"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Conflict Warnings */}
              {checkingConflicts && selectedStaff && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertCircle className="h-5 w-5 animate-pulse" />
                    <span className="text-sm font-medium">Checking for conflicts...</span>
                  </div>
                </div>
              )}

              {!checkingConflicts && conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-900 mb-2">
                        {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                      </h4>
                      <ul className="space-y-2">
                        {conflicts.map((conflict, idx) => (
                          <li key={idx} className="text-sm text-red-700">
                            <span className="font-medium capitalize">
                              {conflict.conflict_type.replace('_', ' ')}:
                            </span>{' '}
                            {conflict.conflict_details}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ You can still assign this staff member, but conflicts should be resolved.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!checkingConflicts && conflicts.length === 0 && selectedStaff && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">No conflicts - available for this event</span>
                  </div>
                </div>
              )}

              {/* Pay Calculation */}
              {selectedStaff && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Estimated Pay</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ${((parseFloat(estimatedHours) || 0) * getStaffRate(selectedStaff)).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {estimatedHours} hours × ${getStaffRate(selectedStaff)}/hr
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStaff("");
                  setAssignmentRole("");
                  setEstimatedHours("8");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStaff}
                disabled={!selectedStaff || !assignmentRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
