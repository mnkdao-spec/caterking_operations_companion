import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { invoice, client, items } = await request.json();

    if (!client?.email) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'CaterKing Operations <billing@caterking.ca>',
      to: [client.email],
      subject: `Invoice ${invoice.invoice_number} from CaterKing Operations`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #F59E0B; padding: 20px; color: white;">
            <h1 style="margin: 0;">CaterKing Operations</h1>
          </div>
          <div style="padding: 30px;">
            <p>Hi ${client.name},</p>
            <p>Thank you for choosing CaterKing Operations for your event. Please find your invoice details below:</p>
            
            <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Invoice: ${invoice.invoice_number}</p>
              <p style="margin: 5px 0;">Total Amount: <strong>$${Number(invoice.total_amount).toFixed(2)}</strong></p>
              <p style="margin: 5px 0;">Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>

            <p>You can view the full PDF and make a payment through our secure portal.</p>
            
            <a href="#" style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
              View Full Invoice
            </a>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions, please reply to this email or contact us at billing@caterking.ca.
            </p>
          </div>
          <div style="background-color: #F3F4F6; padding: 15px; text-align: center; color: #999; font-size: 12px;">
            CaterKing Operations - Professional Catering & Management
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
