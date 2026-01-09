# CaterKing ERP - Web Application Design

## Overview
Desktop web application for comprehensive catering business management. Optimized for large screens, data-intensive operations, and multi-tasking workflows.

## Target Users
- Business owners and managers
- Event planners and coordinators
- Financial/accounting staff
- Marketing and sales teams

## Core Modules

### 1. Executive Dashboard
**Purpose**: High-level business overview and KPIs

**Features**:
- Revenue trends (daily, weekly, monthly, yearly)
- Active events count and upcoming schedule
- Top clients by revenue
- Inventory alerts and low-stock warnings
- Staff utilization metrics
- Profit margin analysis

**Layout**: Grid of metric cards + charts (line, bar, pie)

---

### 2. Event Management
**Purpose**: Plan, track, and manage catering events from proposal to completion

**Features**:
- Calendar view of all events
- Event creation wizard (client, date, venue, guest count, menu)
- Event detail page with timeline and checklist
- Proposal generation and client approval tracking
- Event status workflow (Lead → Confirmed → In Progress → Completed)
- Post-event notes and client feedback

**Layout**: Calendar + sidebar list + detail modal

---

### 3. Menu Builder
**Purpose**: Create and manage catering menus with recipes and pricing

**Features**:
- Menu template library (breakfast, lunch, dinner, cocktail)
- Recipe database with ingredients and instructions
- Ingredient cost tracking
- Automatic pricing calculation (cost + markup)
- Dietary restriction tagging (vegan, gluten-free, etc.)
- Menu PDF export for client proposals

**Layout**: Drag-and-drop menu builder + recipe cards

---

### 4. CRM (Customer Relationship Management)
**Purpose**: Track client relationships and communication history

**Features**:
- Client profiles (contact info, preferences, dietary restrictions)
- Event history and lifetime value
- Communication log (emails, calls, meetings)
- Client satisfaction ratings
- Automated follow-up reminders
- Client segmentation (corporate, wedding, private)

**Layout**: Client list + detail sidebar + communication timeline

---

### 5. Inventory Management
**Purpose**: Track stock levels, suppliers, and purchase orders

**Features**:
- Ingredient database with current stock levels
- Supplier management and contact info
- Purchase order creation and tracking
- Automatic reorder alerts based on min stock levels
- Inventory value reporting
- Waste tracking and cost analysis

**Layout**: Table view with filters + detail modal + supplier cards

---

### 6. Financial Reporting
**Purpose**: Track revenue, expenses, and profitability

**Features**:
- Profit & loss statements
- Revenue by event type
- Cost breakdown (labor, ingredients, overhead)
- Invoice generation and payment tracking
- Tax reporting
- Budget vs. actual analysis

**Layout**: Report dashboard + export to PDF/Excel

---

### 7. Staff Management
**Purpose**: Manage team schedules and assignments

**Features**:
- Staff directory with roles and contact info
- Event staffing assignments
- Shift scheduling
- Time tracking
- Performance notes
- Payroll export

**Layout**: Calendar view + staff cards + assignment modal

---

## Navigation Structure

**Top Navigation**:
- Logo + Company Name
- Dashboard | Events | Menus | Clients | Inventory | Reports | Staff
- Search bar (global)
- Notifications bell
- User profile menu

**Sidebar** (contextual):
- Filters and quick actions for each module
- Recently viewed items
- Shortcuts

---

## Design System

### Colors
- **Primary**: Warm amber (#F59E0B) - matches mobile app
- **Background**: White (#FFFFFF)
- **Surface**: Light gray (#F9FAFB)
- **Text**: Dark gray (#111827)
- **Border**: Medium gray (#E5E7EB)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Headings**: Inter, bold
- **Body**: Inter, regular
- **Data/Numbers**: Tabular nums for alignment

### Components
- **Cards**: Rounded corners, subtle shadow
- **Tables**: Striped rows, sortable columns, pagination
- **Forms**: Inline validation, clear labels
- **Modals**: Slide-in from right for details
- **Charts**: Recharts library, consistent color palette

---

## Integration with Mobile App

### Shared Backend (Supabase)
- Same database schema
- Real-time sync via Supabase Realtime
- Shared authentication

### Data Flow
1. **Web → Mobile**: Event plans created in web appear in mobile "Today" view
2. **Mobile → Web**: KDS order completions update event status in web
3. **Bidirectional**: Inventory updates from both platforms sync instantly

### API Endpoints
- Use the same Supabase tables created for mobile app
- Additional tables for web-specific features (invoices, proposals, reports)

---

## Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date handling**: date-fns
- **Type safety**: TypeScript

---

## Development Priorities

### Phase 1 (MVP)
1. Executive Dashboard
2. Event Management (basic CRUD)
3. Menu Builder (basic)
4. Integration with existing Supabase backend

### Phase 2
5. CRM system
6. Inventory Management (advanced)
7. Financial Reporting

### Phase 3
8. Staff Management
9. Advanced analytics
10. PDF exports and client portals
