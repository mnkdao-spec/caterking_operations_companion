"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { getEvents, getStaff, getStaffAssignments, createStaffAssignment, updateStaffAssignment, deleteStaffAssignment, checkStaffConflicts, type StaffConflict } from "@/lib/supabase-services";
import { accountingService } from "@/lib/accounting-service";
import { Calendar, Users, Clock, DollarSign, Plus, X, AlertCircle, CheckCircle, Edit2 } from "lucide-react";

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
  is_paid?: boolean;
  paid_at?: string;
  staff?: StaffMember;
  event?: Event;
}

export default function SchedulePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayroll, setProcessingPayroll] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<StaffAssignment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [assignmentRole, setAssignmentRole] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("8");
  const [conflicts, setConflicts] = useState<StaffConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [strictMode, setStrictMode] = useState(true);

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

    // Prevent assignment if there are conflicts and strict mode is on
    if (conflicts.length > 0) {
      if (strictMode) {
        alert(`Cannot assign staff: ${conflicts.length} conflict(s) detected. Resolve conflicts or disable Strict Mode to proceed.`);
        return;
      }

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

  async function handleRunPayroll(eventId: string) {
    const eventAssignments = getEventAssignments(eventId).filter(a => !a.is_paid);
    
    if (eventAssignments.length === 0) {
      alert("No unpaid staff assignments for this event.");
      return;
    }

    const total = eventAssignments.reduce((sum, a) => sum + (a.pay_amount || 0), 0);
    
    if (!confirm(`Process payroll for ${eventAssignments.length} staff members? \nTotal: $${total.toFixed(2)} \n\nThis will record a labor expense in the ledger.`)) {
      return;
    }

    setProcessingPayroll(eventId);
    try {
      await accountingService.processPayroll(eventId);
      await loadData();
      alert("Payroll processed successfully and recorded in ledger.");
    } catch (error) {
      console.error("Error processing payroll:", error);
      alert("Failed to process payroll.");
    } finally {
      setProcessingPayroll(null);
    }
  }

  async function handleUpdateShift(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAssignment) return;

    try {
      const hours = parseFloat(editingAssignment.hours_worked.toString());
      const rate = getStaffRate(editingAssignment.staff_id);
      const payAmount = hours * rate;

      await updateStaffAssignment(editingAssignment.id, {
        hours_worked: hours,
        pay_amount: payAmount,
        notes: editingAssignment.notes
      });

      await loadData();
      setEditingAssignment(null);
    } catch (error) {
      console.error("Error updating shift:", error);
      alert("Failed to update shift");
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
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-6">
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

                      {eventAssignments.length > 0 && (
                        <div className="flex items-center gap-3">
                          {eventAssignments.every(a => a.is_paid) ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                              <CheckCircle className="h-3.5 w-3.5" />
                              PAYROLL PROCESSED
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRunPayroll(event.id)}
                              disabled={processingPayroll === event.id}
                              className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                              {processingPayroll === event.id ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Calculator className="h-4 w-4" />
                              )}
                              Run Payroll
                            </button>
                          )}
                        </div>
                      )}
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
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {getStaffName(assignment.staff_id)}
                                  {assignment.is_paid && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-black rounded uppercase">Paid</span>
                                  )}
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
                                {!assignment.is_paid && (
                                  <button
                                    onClick={() => setEditingAssignment(assignment)}
                                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    Adjust Time
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                disabled={assignment.is_paid}
                                className={`text-gray-400 hover:text-red-600 transition-colors ${assignment.is_paid ? 'opacity-0 cursor-default' : ''}`}
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
              {selectedStaff && (
                <div className="flex items-center justify-between py-2 px-1 border-b border-gray-100 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${strictMode ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Conflict Guard</span>
                  </div>
                  <button
                    onClick={() => setStrictMode(!strictMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      strictMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        strictMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

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
                              disabled={!selectedStaff || !assignmentRole || (strictMode && conflicts.length > 0)}
                              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                conflicts.length > 0 && !strictMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {conflicts.length > 0 && strictMode ? 'Resolve Conflicts' : 'Assign Staff'}
                            </button>            </div>
          </div>
        </div>
      )}

      {/* Adjust Shift Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Adjust Shift Time</h2>
              <p className="text-sm text-gray-600 mt-1">
                Editing shift for {getStaffName(editingAssignment.staff_id)}
              </p>
            </div>

            <form onSubmit={handleUpdateShift} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Hours Worked
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingAssignment.hours_worked}
                    onChange={(e) => setEditingAssignment({
                      ...editingAssignment,
                      hours_worked: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">hrs</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700">Recalculated Pay</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  ${(editingAssignment.hours_worked * getStaffRate(editingAssignment.staff_id)).toFixed(2)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Based on ${getStaffRate(editingAssignment.staff_id)}/hr rate
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes / Reason for Change
                </label>
                <textarea
                  value={editingAssignment.notes || ""}
                  onChange={(e) => setEditingAssignment({
                    ...editingAssignment,
                    notes: e.target.value
                  })}
                  placeholder="e.g. Employee forgot to clock out"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
