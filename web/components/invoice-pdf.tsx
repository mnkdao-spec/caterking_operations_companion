"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottom: 2,
    borderBottomColor: "#F59E0B", // CaterKing Amber
    paddingBottom: 20,
  },
  businessInfo: {
    flexDirection: "column",
  },
  businessName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "right",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#666",
    textTransform: "uppercase",
  },
  table: {
    display: "flex",
    width: "auto",
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottom: 1,
    borderBottomColor: "#E5E7EB",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#F3F4F6",
    padding: 8,
  },
  colDesc: { width: "60%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  totalsSection: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsTable: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  grandTotal: {
    borderTop: 1,
    borderTopColor: "#333",
    marginTop: 8,
    paddingTop: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#EEE",
    paddingTop: 20,
    color: "#999",
  }
});

interface InvoiceProps {
  invoice: any;
  items: any[];
  client: any;
}

export const InvoicePDF = ({ invoice, items, client }: InvoiceProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{invoice.business_name}</Text>
          <Text>{invoice.business_address || "Ontario, Canada"}</Text>
          <Text>HST #: {invoice.business_hst_number || "Pending"}</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={{ textAlign: "right", marginTop: 4 }}># {invoice.invoice_number}</Text>
          <Text style={{ textAlign: "right" }}>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Bill To / Ship To */}
      <View style={styles.detailsRow}>
        <View>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={{ fontWeight: "bold" }}>{client?.name || "Customer"}</Text>
          <Text>{client?.email || ""}</Text>
          <Text>{client?.phone || ""}</Text>
        </View>
        <View style={{ textAlign: "right" }}>
          <Text style={styles.sectionTitle}>Payment Terms:</Text>
          <Text>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</Text>
          <Text>{invoice.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>${Number(item.unit_price).toFixed(2)}</Text>
            <Text style={styles.colTotal}>${Number(item.total_price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsTable}>
          <View style={styles.totalsRow}>
            <Text>Subtotal (Net):</Text>
            <Text>${Number(invoice.subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>HST (13%):</Text>
            <Text>${Number(invoice.tax_total).toFixed(2)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.grandTotal]}>
            <Text>Total Amount:</Text>
            <Text>${Number(invoice.total_amount).toFixed(2)}</Text>
          </View>
          {Number(invoice.deposit_paid) > 0 && (
            <View style={styles.totalsRow}>
              <Text>Less Deposit Paid:</Text>
              <Text>-${Number(invoice.deposit_paid).toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { fontWeight: "bold", marginTop: 4 }]}>
            <Text>Balance Due (CAD):</Text>
            <Text>${Number(invoice.balance_due).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Notes & Footer */}
      <View style={{ marginTop: 50 }}>
        <Text style={styles.sectionTitle}>Notes & Terms</Text>
        <Text style={{ color: "#666", lineHeight: 1.5 }}>{invoice.notes || ""}</Text>
        <Text style={{ color: "#666", marginTop: 10 }}>{invoice.terms}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for choosing CaterKing Operations. We appreciate your business!</Text>
        <Text style={{ marginTop: 4 }}>Electronic Invoice - Generated on {new Date().toLocaleString()}</Text>
      </View>
    </Page>
  </Document>
);
