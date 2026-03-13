import { supabase } from "./supabase";

export type TransactionType = 'income' | 'expense' | 'investment' | 'draw';
export type FinancialCategory = 'food_cost' | 'labor' | 'licensing' | 'equipment' | 'utility' | 'marketing' | 'sales' | 'rent' | 'insurance' | 'other';

export interface LedgerEntry {
  id: string;
  transaction_date: string;
  amount: number;
  tax_amount: number; // HST
  transaction_type: TransactionType;
  category: FinancialCategory;
  description: string;
  reference_id?: string;
  reference_type?: string;
}

export interface TaxSummary {
  total_sales_net: number;
  hst_collected: number;
  total_expenses_net: number;
  hst_paid_itc: number;
  net_hst_remittance: number;
}

export const accountingService = {
  /**
   * Get Canadian HST and Tax Summary
   */
  async getTaxSummary(startDate: string, endDate: string): Promise<TaxSummary | null> {
    const { data, error } = await supabase.rpc("get_canadian_tax_summary", {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error("Error fetching tax summary:", error);
      return null;
    }

    return data?.[0] || null;
  },
  /**
   * Get ledger entries with optional filtering
   */
  async getLedger(filters?: { 
    startDate?: string; 
    endDate?: string; 
    category?: FinancialCategory;
    type?: TransactionType;
  }): Promise<LedgerEntry[]> {
    let query = supabase.from("financial_ledger").select("*");

    if (filters?.startDate) query = query.gte("transaction_date", filters.startDate);
    if (filters?.endDate) query = query.lte("transaction_date", filters.endDate);
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.type) query = query.eq("transaction_type", filters.type);

    const { data, error } = await query.order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching ledger:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Get aggregated financial summary for a period
   */
  async getPeriodSummary(startDate: string, endDate: string): Promise<FinancialSummary | null> {
    const { data, error } = await supabase.rpc("get_financial_summary", {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error("Error fetching financial summary:", error);
      return null;
    }

    return data?.[0] || null;
  },

  /**
   * Record a manual ledger entry
   */
  async recordTransaction(entry: Omit<LedgerEntry, 'id'>) {
    const { data, error } = await supabase
      .from("financial_ledger")
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new client payment (income)
   */
  async createPayment(payment: {
    amount: number;
    payment_date: string;
    description: string;
    method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
    reference_number?: string;
  }) {
    const { data, error } = await supabase
      .from("payments")
      .insert([{
        amount: payment.amount,
        payment_date: payment.payment_date,
        notes: payment.description,
        method: payment.method,
        reference_number: payment.reference_number
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new vendor bill
   */
  async createVendorBill(bill: {
    vendor_name: string;
    amount: number;
    due_date?: string;
    category: FinancialCategory;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from("vendor_bills")
      .insert([bill])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark a bill as paid (this triggers the ledger sync in DB)
   */
  async markBillAsPaid(billId: string) {
    const { data, error } = await supabase
      .from("vendor_bills")
      .update({ status: 'paid' })
      .eq("id", billId)
      .select()
      .single();

    if (error) throw error;
    return data?.[0] || null;
  },

  /**
   * Send Invoice PDF to Client via Email
   */
  async sendInvoiceEmail(data: { invoice: any; client: any; items: any[] }) {
    const response = await fetch("/api/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email");
    }

    return response.json();
  },

  /**
   * Process payroll for an event (Moves labor costs to ledger)
   */
  async processPayroll(eventId: string): Promise<{ total_paid: number; staff_count: number } | null> {
    const { data, error } = await supabase.rpc("process_payroll_for_event", {
      p_event_id: eventId
    });

    if (error) {
      console.error("Error processing payroll:", error);
      throw error;
    }

    return data?.[0] || null;
  }
};
