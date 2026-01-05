# CaterKing Operations Companion - Mobile App Design

## Overview
A mobile-first utility app for kitchen staff and event leads to manage real-time alerts, event checklists, and inventory during catering operations. Designed for one-handed use in fast-paced environments.

---

## Screen List

### 1. Today's Events (Home)
The primary landing screen showing all events for the current day.

### 2. Kitchen Alerts
A real-time feed of alerts from the kitchen (low inventory, prep status, new orders).

### 3. Event Checklist
A task management screen for tracking event-specific preparation and execution tasks.

### 4. Inventory Quick-Check
A simplified inventory view with QR scanning capability for quick lookups.

### 5. Profile/Settings
User preferences, notification settings, and role configuration.

---

## Primary Content and Functionality

### Today's Events (Home)
- **Content**: List of today's events with status badges (In Progress, Upcoming, Completed)
- **Data per event**: Event name, client, time, guest count, venue, assigned staff
- **Functionality**:
  - Tap event to view full details
  - Quick-action buttons: "Start Prep", "Mark Complete"
  - Pull-to-refresh for latest data

### Kitchen Alerts
- **Content**: Chronological feed of alerts with type indicators
- **Alert types**: Warning (low inventory), Success (prep complete), Info (new order)
- **Functionality**:
  - Swipe to dismiss/acknowledge
  - Tap for more details
  - Filter by alert type

### Event Checklist
- **Content**: Task list grouped by event
- **Task data**: Task name, assignee, due time, status (pending/done)
- **Functionality**:
  - Tap checkbox to mark complete
  - Add new tasks
  - Assign tasks to team members
  - Progress indicator per event

### Inventory Quick-Check
- **Content**: Searchable inventory list with stock levels
- **Item data**: Name, quantity, unit, status (OK/Low/Critical)
- **Functionality**:
  - Search by name
  - QR code scanner button (future: scan to lookup)
  - Quick update stock count

---

## Key User Flows

### Flow 1: Check Today's Schedule
1. Open app → Land on "Today's Events"
2. View list of events sorted by time
3. Tap event card → See full details (menu, staff, checklist)

### Flow 2: Respond to Kitchen Alert
1. Receive push notification for low inventory
2. Open app → Navigate to "Kitchen Alerts"
3. Tap alert → See item details and suggested action
4. Swipe to acknowledge

### Flow 3: Complete Event Tasks
1. Navigate to "Event Checklist"
2. Select active event
3. View task list with assignments
4. Tap checkbox to mark tasks complete
5. See progress bar update

### Flow 4: Quick Inventory Check
1. Navigate to "Inventory"
2. Search for item or tap QR scanner
3. View current stock level
4. Update quantity if needed

---

## Color Choices

Based on the CaterKing brand identity (warm, professional, culinary-focused):

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **primary** | `#D97706` (Amber 600) | `#F59E0B` (Amber 500) | Brand accent, CTAs, active states |
| **background** | `#FFFBF5` (Warm white) | `#1C1917` (Stone 900) | Screen backgrounds |
| **surface** | `#FEF3E2` (Warm cream) | `#292524` (Stone 800) | Cards, elevated surfaces |
| **foreground** | `#1C1917` (Stone 900) | `#FAFAF9` (Stone 50) | Primary text |
| **muted** | `#78716C` (Stone 500) | `#A8A29E` (Stone 400) | Secondary text |
| **border** | `#E7E5E4` (Stone 200) | `#44403C` (Stone 700) | Dividers, borders |
| **success** | `#16A34A` (Green 600) | `#22C55E` (Green 500) | Completed tasks, positive alerts |
| **warning** | `#EA580C` (Orange 600) | `#F97316` (Orange 500) | Low inventory, warnings |
| **error** | `#DC2626` (Red 600) | `#EF4444` (Red 500) | Critical alerts, errors |

---

## Navigation Structure

**Tab Bar (Bottom Navigation)**:
1. **Today** - Home icon - Today's Events
2. **Alerts** - Bell icon - Kitchen Alerts (with badge for unread)
3. **Tasks** - Checklist icon - Event Checklist
4. **Inventory** - Box icon - Inventory Quick-Check

---

## Design Principles

1. **Glanceable**: Information must be readable at a glance in a busy kitchen
2. **One-handed**: All primary actions reachable with thumb
3. **High contrast**: Clear visual hierarchy for quick scanning
4. **Haptic feedback**: Confirm actions with tactile response
5. **Offline-ready**: Core features work without network (future)

---

## Typography

- **Headers**: Bold, 24-32px for screen titles
- **Body**: Regular, 16-18px for readable content
- **Captions**: Medium, 12-14px for metadata
- **Line height**: 1.4x minimum for readability

---

## Component Patterns

### Event Card
- Rounded corners (16px)
- Subtle shadow for elevation
- Status badge top-right
- Time prominently displayed
- Guest count with icon

### Alert Item
- Left color bar indicating type
- Icon matching alert type
- Timestamp right-aligned
- Swipe gesture for dismiss

### Task Item
- Checkbox left-aligned
- Task name with assignee below
- Due time right-aligned
- Strike-through when complete
