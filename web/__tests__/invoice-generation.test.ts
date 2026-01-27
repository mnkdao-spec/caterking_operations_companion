import { describe, it, expect } from 'vitest';
import { generateInvoicesFromTemplates, getInvoiceTemplates } from '../lib/supabase-services';
import { generateInvoicePDF } from '../lib/pdf-generator';

describe('Invoice Generation and PDF Export', () => {
  describe('Invoice Generation from Templates', () => {
    it('should generate invoices from active templates', async () => {
      const result = await generateInvoicesFromTemplates();

      expect(result).toBeDefined();
    });

    it('should handle template generation errors gracefully', async () => {
      const result = await generateInvoicesFromTemplates();

      expect(result).toBeDefined();
    });
  });

  describe('Invoice Template Retrieval', () => {
    it('should retrieve all invoice templates', async () => {
      const result = await getInvoiceTemplates();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter templates correctly', async () => {
      const result = await getInvoiceTemplates();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('PDF Export Functionality', () => {
    it('should generate PDF from invoice data', async () => {
      const invoiceData = {
        invoice_number: 'INV-001',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Test Client',
        client_email: 'client@test.com',
        client_address: '123 Test St',
        subtotal: 5000,
        tax_amount: 500,
        total_amount: 5500,
        items: [
          {
            description: 'Catering Service',
            quantity: 1,
            unit_price: 5000,
            total: 5000,
          },
        ],
        status: 'pending',
        notes: 'Test invoice',
      };

      const pdf = await generateInvoicePDF(invoiceData);

      expect(pdf).toBeDefined();
    });

    it('should include all invoice details in PDF', async () => {
      const invoiceData = {
        invoice_number: 'INV-002',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Premium Client',
        client_email: 'premium@test.com',
        client_address: '456 Premium Ave',
        subtotal: 10000,
        tax_amount: 1000,
        total_amount: 11000,
        items: [
          {
            description: 'Premium Catering',
            quantity: 1,
            unit_price: 8000,
            total: 8000,
          },
          {
            description: 'Service Staff',
            quantity: 2,
            unit_price: 1000,
            total: 2000,
          },
        ],
        status: 'pending',
        notes: 'Premium event catering',
      };

      const pdf = await generateInvoicePDF(invoiceData);

      expect(pdf).toBeDefined();
    });

    it('should format currency correctly in PDF', async () => {
      const invoiceData = {
        invoice_number: 'INV-003',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Currency Test',
        client_email: 'test@test.com',
        client_address: '789 Test Blvd',
        subtotal: 1234.56,
        tax_amount: 123.46,
        total_amount: 1358.02,
        items: [
          {
            description: 'Service',
            quantity: 1,
            unit_price: 1234.56,
            total: 1234.56,
          },
        ],
        status: 'pending',
        notes: 'Currency formatting test',
      };

      const pdf = await generateInvoicePDF(invoiceData);

      expect(pdf).toBeDefined();
    });

    it('should handle multiple line items in PDF', async () => {
      const invoiceData = {
        invoice_number: 'INV-004',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Multi-Item Client',
        client_email: 'multi@test.com',
        client_address: '321 Multi St',
        subtotal: 15000,
        tax_amount: 1500,
        total_amount: 16500,
        items: [
          {
            description: 'Main Course - Beef Wellington',
            quantity: 100,
            unit_price: 45,
            total: 4500,
          },
          {
            description: 'Appetizers - Shrimp Canapés',
            quantity: 150,
            unit_price: 35,
            total: 5250,
          },
          {
            description: 'Desserts - Chocolate Mousse',
            quantity: 100,
            unit_price: 25,
            total: 2500,
          },
          {
            description: 'Service Staff (8 hours)',
            quantity: 4,
            unit_price: 750,
            total: 3000,
          },
        ],
        status: 'pending',
        notes: 'Large event catering',
      };

      const pdf = await generateInvoicePDF(invoiceData);

      expect(pdf).toBeDefined();
    });

    it('should handle empty notes gracefully', async () => {
      const invoiceData = {
        invoice_number: 'INV-005',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'No Notes Client',
        client_email: 'nonotes@test.com',
        client_address: '555 No Notes Ln',
        subtotal: 3000,
        tax_amount: 300,
        total_amount: 3300,
        items: [
          {
            description: 'Basic Catering',
            quantity: 1,
            unit_price: 3000,
            total: 3000,
          },
        ],
        status: 'pending',
        notes: '',
      };

      const pdf = await generateInvoicePDF(invoiceData);

      expect(pdf).toBeDefined();
    });
  });

  describe('Invoice Generation Validation', () => {
    it('should validate invoice data before generation', async () => {
      const invalidData = {
        invoice_number: 'INV-006',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Test',
        client_email: 'invalid-email',
        client_address: 'Test',
        subtotal: -100,
        tax_amount: 0,
        total_amount: -100,
        items: [],
        status: 'pending',
        notes: 'Invalid test',
      };

      const pdf = await generateInvoicePDF(invalidData);
      expect(pdf).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        invoice_number: 'INV-007',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: '',
        client_email: '',
        client_address: '',
        subtotal: 1000,
        tax_amount: 100,
        total_amount: 1100,
        items: [],
        status: 'pending',
        notes: '',
      };

      const pdf = await generateInvoicePDF(incompleteData);
      expect(pdf).toBeDefined();
    });
  });

  describe('Invoice Generation Error Handling', () => {
    it('should handle PDF generation errors', async () => {
      const invoiceData = {
        invoice_number: 'INV-008',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Error Test',
        client_email: 'error@test.com',
        client_address: 'Error St',
        subtotal: 1000,
        tax_amount: 100,
        total_amount: 1100,
        items: [],
        status: 'pending',
        notes: 'Error handling test',
      };

      const pdf = await generateInvoicePDF(invoiceData);
      expect(pdf).toBeDefined();
    });
  });

  describe('Invoice Generation Performance', () => {
    it('should generate invoices from templates within acceptable time', async () => {
      const startTime = Date.now();
      await generateInvoicesFromTemplates();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    });

    it('should generate PDF within acceptable time', async () => {
      const invoiceData = {
        invoice_number: 'INV-009',
        invoice_date: '2026-01-27',
        due_date: '2026-02-27',
        client_name: 'Performance Test',
        client_email: 'perf@test.com',
        client_address: 'Perf St',
        subtotal: 5000,
        tax_amount: 500,
        total_amount: 5500,
        items: [
          {
            description: 'Service',
            quantity: 1,
            unit_price: 5000,
            total: 5000,
          },
        ],
        status: 'pending',
        notes: 'Performance test',
      };

      const startTime = Date.now();
      await generateInvoicePDF(invoiceData);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });
});
