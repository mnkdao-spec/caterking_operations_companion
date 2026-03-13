/**
 * Unified database types shared between mobile and web apps
 * These types represent the Supabase database schema
 */

// ============================================================================
// CORE BUSINESS ENTITIES
// ============================================================================

export interface Client {
  id: string;
  client_name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
  hourly_rate?: number;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  client_id: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  venue_name?: string;
  guest_count?: number;
  budget?: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  cost?: number;
  price?: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffAssignment {
  id: string;
  staff_id: string;
  event_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INVOICING ENTITIES
// ============================================================================

export interface InvoiceTemplate {
  id: string;
  client_id: string;
  template_name: string;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  next_generation_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplateItem {
  id: string;
  template_id: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  event_id?: string;
  template_id?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// KDS (KITCHEN DISPLAY SYSTEM) ENTITIES
// ============================================================================

export type StationType = 'expo' | 'grill' | 'saute' | 'garde_manger' | 'dessert' | 'plating';
export type OrderStatus = 'queued' | 'cooking' | 'done';
export type CourseStatus = 'pending' | 'fired' | 'in_progress' | 'ready' | 'served';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  station: StationType;
  modifications?: string[];
  status: OrderStatus;
  fired_at?: string;
  bumped_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FiredCourse {
  id: string;
  event_id: string;
  table_group: string;
  table_number: number;
  course_number: number;
  course_name: string;
  items: OrderItem[];
  fired_at: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INVENTORY ENTITIES
// ============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  min_threshold?: number;
  max_threshold?: number;
  cost_per_unit?: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  inventory_item_id: string;
  quantity_change: number;
  reason: string;
  user_id?: string;
  created_at: string;
}

// ============================================================================
// PROCUREMENT & PAYABLES ENTITIES
// ============================================================================

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'partially_received' | 'received' | 'canceled';

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  created_by?: string;
  authorized_by?: string;
  parent_po_id?: string;
  created_at: string;
  updated_at: string;
}

export interface POItem {
  id: string;
  po_id: string;
  ingredient_id?: string;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  surge_threshold_percent: number;
  created_at: string;
}

export interface OCRAuditLog {
  id: string;
  po_id?: string;
  raw_json: any;
  confidence_score?: number;
  processed_at: string;
}

// ============================================================================
// AVAILABILITY & SCHEDULING
// ============================================================================

export interface StaffAvailability {
  id: string;
  staff_id: string;
  availability_type: 'time_off' | 'unavailable' | 'preferred_shift';
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SYNC & METADATA
// ============================================================================

export interface SyncMetadata {
  id: string;
  entity_type: string;
  entity_id: string;
  last_synced: string;
  platform: 'mobile' | 'web' | 'both';
  version: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface EventFilters {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface StaffFilters {
  role?: string;
  availability?: boolean;
  limit?: number;
  offset?: number;
}

export interface InvoiceFilters {
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}