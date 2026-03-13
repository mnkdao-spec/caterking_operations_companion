# Staff Scheduling System - End-to-End Test Plan

## Overview
This document outlines comprehensive testing procedures for the staff scheduling calendar system, including staff assignments, conflict detection, availability management, and pay calculations.

## Test Environment Setup

**Prerequisites:**
- Web ERP running on http://localhost:3000
- Supabase database with test data (events, staff, clients)
- At least 3 staff members with different roles
- At least 2 events scheduled on the same date

## Test Scenarios

### 1. Schedule Page Navigation & Display
**Objective:** Verify the schedule page loads correctly and displays events

**Steps:**
1. Navigate to Schedule page from main navigation
2. Verify page title "Schedule" is displayed
3. Verify event list shows all upcoming events
4. Verify staff roster displays all available staff members
5. Verify each event shows: name, date, time, client, venue, budget

**Expected Results:**
- ✓ Schedule page loads without errors
- ✓ All events are displayed in the list
- ✓ Staff roster shows all staff members
- ✓ Event details are complete and accurate

---

### 2. Staff Assignment - Basic Assignment
**Objective:** Test assigning staff to events without conflicts

**Steps:**
1. Click "Assign Staff" button on an event
2. Select a staff member from the dropdown
3. Verify the assignment modal shows the selected staff
4. Click "Save" to confirm assignment
5. Verify the staff member is now listed under the event

**Expected Results:**
- ✓ Assignment modal opens correctly
- ✓ Staff member can be selected
- ✓ Assignment is saved to database
- ✓ Staff member appears in event's staff list

---

### 3. Conflict Detection - Double Booking Prevention
**Objective:** Test that the system prevents double-booking conflicts

**Steps:**
1. Assign Staff Member A to Event 1 (Jan 26, 12:00 PM)
2. Try to assign the same Staff Member A to Event 2 (Jan 26, 12:00 PM - same time)
3. Verify conflict warning appears
4. Verify warning shows: conflict type, time, and existing assignment details
5. Verify "Save" button is disabled when conflicts exist

**Expected Results:**
- ✓ Red conflict warning appears below form
- ✓ Warning shows "Already assigned to [Event Name] as [Role]"
- ✓ Save button is disabled
- ✓ User cannot submit assignment with active conflicts

---

### 4. Conflict Resolution - Suggested Alternatives
**Objective:** Test that the system suggests alternative staff when conflicts occur

**Steps:**
1. Trigger a conflict (as in Test 3)
2. Verify "Suggested Alternatives" section appears
3. Verify suggested staff have the same role as the conflicted staff
4. Verify suggested staff are available at the event time
5. Click on a suggested alternative to auto-select it
6. Verify the new selection resolves the conflict

**Expected Results:**
- ✓ Suggested alternatives appear when conflict detected
- ✓ Suggestions show staff with matching roles
- ✓ Clicking suggestion auto-selects the staff member
- ✓ Conflict warning disappears after selecting alternative
- ✓ Save button becomes enabled

---

### 5. Staff Availability Management
**Objective:** Test setting and managing staff availability periods

**Steps:**
1. Navigate to Staff page
2. Click "Availability" button on a staff member
3. Click "+ Add Availability Period"
4. Fill in form:
   - Start Date/Time: Jan 28, 9:00 AM
   - End Date/Time: Jan 28, 5:00 PM
   - Type: "Time Off"
   - Reason: "Vacation"
5. Click "Save"
6. Verify the availability period appears in the list
7. Try to assign this staff to an event during this time
8. Verify conflict warning appears for unavailable period

**Expected Results:**
- ✓ Availability modal opens and displays correctly
- ✓ Availability period is saved to database
- ✓ Period appears in "Scheduled Periods" list
- ✓ Conflict detection includes availability periods
- ✓ Cannot assign staff during unavailable times

---

### 6. Assignment Deletion
**Objective:** Test removing staff assignments

**Steps:**
1. Assign a staff member to an event
2. Click the delete/remove button on the assignment
3. Confirm the deletion
4. Verify the staff member is removed from the event

**Expected Results:**
- ✓ Delete button is visible on each assignment
- ✓ Confirmation dialog appears before deletion
- ✓ Assignment is removed from database
- ✓ Staff member no longer appears in event's staff list

---

### 7. Pay Calculations Display
**Objective:** Test that assigned hours and pay are calculated correctly

**Steps:**
1. Assign a staff member with hourly rate $25 to an 8-hour event
2. Verify the assignment shows: hours worked (8), hourly rate ($25), total pay ($200)
3. Assign another staff member to the same event
4. Verify each assignment shows correct individual calculations
5. Verify total labor cost is sum of all assignments

**Expected Results:**
- ✓ Hours are calculated based on event duration
- ✓ Pay is calculated as hours × hourly rate
- ✓ Multiple assignments show individual calculations
- ✓ Total labor cost is accurate

---

### 8. Assignment Persistence
**Objective:** Test that assignments persist across page refreshes

**Steps:**
1. Assign staff to an event
2. Refresh the page (F5)
3. Navigate back to Schedule page
4. Verify the assignment is still there

**Expected Results:**
- ✓ Assignments persist in database
- ✓ Data loads correctly after refresh
- ✓ No data loss occurs

---

### 9. Multiple Events on Same Day
**Objective:** Test scheduling multiple events on the same day

**Steps:**
1. Create/find 2 events on Jan 26 (different times)
2. Assign Staff A to Event 1 (12:00 PM - 8:00 PM)
3. Assign Staff A to Event 2 (8:00 PM - 12:00 AM)
4. Verify both assignments are allowed (no overlap)
5. Try to assign Staff A to Event 3 (7:00 PM - 9:00 PM)
6. Verify conflict warning appears (overlaps with Event 1)

**Expected Results:**
- ✓ Back-to-back events can be assigned to same staff
- ✓ Overlapping events trigger conflict warning
- ✓ Conflict detection correctly identifies time overlaps

---

### 10. Role-Based Availability
**Objective:** Test that staff can only be assigned to events needing their role

**Steps:**
1. Note a staff member's role (e.g., "Executive Chef")
2. Assign them to an event requiring that role
3. Verify assignment succeeds
4. Check if system restricts assignment to events not needing that role (if implemented)

**Expected Results:**
- ✓ Staff can be assigned to events needing their role
- ✓ Role information is displayed in assignment modal
- ✓ No restrictions prevent cross-role assignment (if not implemented)

---

## Test Execution Checklist

- [ ] All 10 test scenarios completed
- [ ] No critical errors encountered
- [ ] All conflict detection working correctly
- [ ] All data persists correctly
- [ ] Pay calculations are accurate
- [ ] User experience is smooth and intuitive
- [ ] Error messages are clear and helpful
- [ ] Performance is acceptable (no lag)

## Known Limitations

1. **Drag-and-drop assignment** - Not yet implemented (planned enhancement)
2. **Bulk staff assignment** - Not yet implemented
3. **Calendar view** - Currently list-based, not calendar grid
4. **Recurring events** - Not yet supported

## Bugs Found During Testing

(To be filled during testing)

---

## Sign-Off

**Tester:** ___________________
**Date:** ___________________
**Status:** ☐ PASS ☐ FAIL ☐ PARTIAL PASS

**Notes:**
