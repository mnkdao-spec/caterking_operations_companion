import jsPDF from "jspdf";
import { Invoice, InvoiceItem } from "./supabase-services";

export async function generateInvoicePDF(
  invoice: Invoice,
  invoiceItems: InvoiceItem[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header with company branding
  doc.setFontSize(24);
  doc.setTextColor(217, 119, 6); // Amber color matching brand
  doc.text("CaterKing", 20, yPosition);
  yPosition += 10;

  // Company info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Professional Catering Services", 20, yPosition);
  yPosition += 5;
  doc.text("Email: info@caterking.com | Phone: (555) 123-4567", 20, yPosition);
  yPosition += 10;

  // Divider line
  doc.setDrawColor(217, 119, 6);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Invoice title and number
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", 20, yPosition);
  yPosition += 8;

  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 20, yPosition);
  yPosition += 5;
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, yPosition);
    yPosition += 5;
  }
  yPosition += 5;

  // Bill To section
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Bill To:", 20, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(invoice.client_name || "Unknown Client", 20, yPosition);
  yPosition += 5;
  if (invoice.client_email) {
    doc.text(`Email: ${invoice.client_email}`, 20, yPosition);
    yPosition += 5;
  }
  if (invoice.client_phone) {
    doc.text(`Phone: ${invoice.client_phone}`, 20, yPosition);
    yPosition += 5;
  }
  yPosition += 5;

  // Line items table header
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");

  const colX = {
    description: 20,
    quantity: 100,
    unitPrice: 130,
    total: 160,
  };

  doc.text("Description", colX.description, yPosition, { align: "left" });
  doc.text("Qty", colX.quantity, yPosition, { align: "center" });
  doc.text("Unit Price", colX.unitPrice, yPosition, { align: "right" });
  doc.text("Total", colX.total, yPosition, { align: "right" });
  yPosition += 7;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 5;

  // Line items
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);

  invoiceItems.forEach((item) => {
    const description = item.description.substring(0, 40);
    doc.text(description, colX.description, yPosition);
    doc.text(item.quantity.toString(), colX.quantity, yPosition, { align: "center" });
    doc.text(`$${item.unit_price.toFixed(2)}`, colX.unitPrice, yPosition, { align: "right" });
    doc.text(`$${item.total_price.toFixed(2)}`, colX.total, yPosition, { align: "right" });
    yPosition += 5;
  });

  yPosition += 5;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 7;

  // Totals section (right-aligned)
  const totalX = 130;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  doc.text("Subtotal:", totalX, yPosition, { align: "left" });
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 6;

  doc.text("Tax (8%):", totalX, yPosition, { align: "left" });
  doc.text(`$${invoice.tax_amount.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 6;

  // Total - highlighted
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(217, 119, 6);
  doc.text("Total Amount:", totalX, yPosition, { align: "left" });
  doc.text(`$${invoice.total_amount.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 10;

  // Status
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, yPosition, { align: "left" });
  yPosition += 8;

  // Notes section
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.text("Notes:", 20, yPosition, { align: "left" });
    yPosition += 5;
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(noteLines, 20, yPosition, { align: "left" });
    yPosition += noteLines.length * 4;
  }

  // Footer
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business!", 20, yPosition, { align: "left" });
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    pageWidth - 20,
    yPosition,
    { align: "right" }
  );

  // Save the PDF
  doc.save(`${invoice.invoice_number}.pdf`);
}
