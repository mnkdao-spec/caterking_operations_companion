/**
 * Email Notification Service
 * Handles sending email notifications for various events
 */

import { supabase } from './supabase';

export interface EmailNotification {
  to: string;
  subject: string;
  template: 'event_confirmed' | 'staff_assigned' | 'invoice_generated' | 'event_status_changed';
  data: Record<string, any>;
}

/**
 * Send email notification using Supabase Edge Functions
 */
export async function sendEmailNotification(notification: EmailNotification) {
  try {
    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: notification.to,
        subject: notification.subject,
        template: notification.template,
        data: notification.data,
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

/**
 * Send event confirmation email
 */
export async function sendEventConfirmationEmail(
  clientEmail: string,
  eventName: string,
  eventDate: string,
  eventTime: string,
  venue: string,
  guestCount: number
) {
  return sendEmailNotification({
    to: clientEmail,
    subject: `Event Confirmed: ${eventName}`,
    template: 'event_confirmed',
    data: {
      eventName,
      eventDate,
      eventTime,
      venue,
      guestCount,
    },
  });
}

/**
 * Send staff assignment email
 */
export async function sendStaffAssignmentEmail(
  staffEmail: string,
  staffName: string,
  eventName: string,
  eventDate: string,
  eventTime: string,
  role: string,
  venue: string
) {
  return sendEmailNotification({
    to: staffEmail,
    subject: `New Assignment: ${eventName} - ${role}`,
    template: 'staff_assigned',
    data: {
      staffName,
      eventName,
      eventDate,
      eventTime,
      role,
      venue,
    },
  });
}

/**
 * Send invoice generation email
 */
export async function sendInvoiceGeneratedEmail(
  clientEmail: string,
  clientName: string,
  invoiceNumber: string,
  eventName: string,
  totalAmount: number,
  invoiceUrl: string
) {
  return sendEmailNotification({
    to: clientEmail,
    subject: `Invoice #${invoiceNumber} - ${eventName}`,
    template: 'invoice_generated',
    data: {
      clientName,
      invoiceNumber,
      eventName,
      totalAmount,
      invoiceUrl,
    },
  });
}

/**
 * Send event status change email
 */
export async function sendEventStatusChangeEmail(
  clientEmail: string,
  clientName: string,
  eventName: string,
  oldStatus: string,
  newStatus: string
) {
  return sendEmailNotification({
    to: clientEmail,
    subject: `Event Status Update: ${eventName}`,
    template: 'event_status_changed',
    data: {
      clientName,
      eventName,
      oldStatus,
      newStatus,
    },
  });
}

/**
 * Store email notification in database for tracking
 */
export async function logEmailNotification(
  recipientEmail: string,
  template: string,
  eventId?: string,
  staffId?: string,
  invoiceId?: string
) {
  try {
    const { data, error } = await supabase
      .from('email_notifications')
      .insert({
        recipient_email: recipientEmail,
        template,
        event_id: eventId,
        staff_id: staffId,
        invoice_id: invoiceId,
        sent_at: new Date().toISOString(),
        status: 'sent',
      });

    if (error) {
      console.error('Error logging email notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in logEmailNotification:', error);
    return { success: false, error };
  }
}
