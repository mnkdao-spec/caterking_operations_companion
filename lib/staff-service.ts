import { supabase } from "./supabase-client";

export interface StaffShift {
  id: string;
  staff_id: string;
  event_id: string;
  role: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number;
  pay_amount: number;
  is_paid: boolean;
  event_name?: string;
}

export const staffService = {
  /**
   * Get all active assignments for a staff member (for today and future)
   */
  async getMyAssignments(staffId: string): Promise<StaffShift[]> {
    const { data, error } = await supabase
      .from("staff_assignments")
      .select(`
        *,
        events (event_name)
      `)
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }

    return (data || []).map(d => ({
      ...d,
      event_name: d.events?.event_name || "Unknown Event"
    }));
  },

  /**
   * Clock In
   */
  async clockIn(assignmentId: string): Promise<boolean> {
    const { error } = await supabase
      .from("staff_assignments")
      .update({
        check_in_time: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    if (error) {
      console.error("Clock in failed:", error);
      return false;
    }
    return true;
  },

  /**
   * Clock Out (Calculates hours and pay automatically)
   */
  async clockOut(assignmentId: string): Promise<boolean> {
    // 1. Get check-in time and staff rate
    const { data: assignment, error: fetchError } = await supabase
      .from("staff_assignments")
      .select(`
        check_in_time,
        staff:staff (hourly_rate)
      `)
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment?.check_in_time) {
      console.error("Could not find check-in time for clock out");
      return false;
    }

    const checkIn = new Date(assignment.check_in_time);
    const checkOut = new Date();
    
    // Calculate decimal hours (e.g., 8.5 hours)
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = Math.max(0.1, diffMs / (1000 * 60 * 60)); 
    
    const rate = (assignment.staff as any)?.hourly_rate || 0;
    const pay = hours * rate;

    // 2. Update assignment with totals
    const { error: updateError } = await supabase
      .from("staff_assignments")
      .update({
        check_out_time: checkOut.toISOString(),
        hours_worked: parseFloat(hours.toFixed(2)),
        pay_amount: parseFloat(pay.toFixed(2))
      })
      .eq("id", assignmentId);

    if (updateError) {
      console.error("Clock out failed:", updateError);
      return false;
    }
    return true;
  },

  /**
   * Get Earnings Summary for Staff Portal
   */
  async getEarningsSummary(staffId: string) {
    const { data, error } = await supabase
      .from("staff_assignments")
      .select("pay_amount, is_paid, check_in_time, check_out_time")
      .eq("staff_id", staffId);

    if (error) {
      console.error("Error fetching earnings summary:", error);
      return { unpaid: 0, paidYTD: 0, upcoming: 0 };
    }

    const summary = (data || []).reduce((acc, shift) => {
      const amount = Number(shift.pay_amount) || 0;
      
      if (shift.is_paid) {
        acc.paidYTD += amount;
      } else if (shift.check_out_time) {
        // Clocked out but not yet processed by admin
        acc.unpaid += amount;
      } else if (!shift.check_in_time) {
        // Future scheduled shift
        acc.upcoming += amount;
      }
      
      return acc;
    }, { unpaid: 0, paidYTD: 0, upcoming: 0 });

    return summary;
  }
};
