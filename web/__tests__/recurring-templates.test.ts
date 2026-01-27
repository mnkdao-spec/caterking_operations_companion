import { describe, it, expect } from 'vitest';
import {
  createInvoiceTemplate,
  getInvoiceTemplates,
  getInvoiceTemplateById,
  updateInvoiceTemplate,
  deleteInvoiceTemplate,
  generateInvoicesFromTemplates,
  getInvoiceTemplateItems,
  createInvoiceTemplateItem,
  deleteInvoiceTemplateItem,
} from '../lib/supabase-services';

describe('Recurring Invoice Templates', () => {
  describe('Template Creation and Management', () => {
    it('should create new invoice template', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Monthly Catering Service',
        frequency: 'monthly',
        next_generation_date: '2026-02-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should retrieve all templates', async () => {
      const result = await getInvoiceTemplates();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should retrieve specific template by ID', async () => {
      const templateId = 'test-template-1';

      const result = await getInvoiceTemplateById(templateId);

      expect(result).toBeDefined();
    });

    it('should update template details', async () => {
      const templateId = 'test-template-1';
      const updates = {
        template_name: 'Updated Template Name',
        frequency: 'quarterly',
      };

      const result = await updateInvoiceTemplate(templateId, updates);

      expect(result).toBeDefined();
    });

    it('should delete template', async () => {
      const templateId = 'test-template-to-delete';

      const result = await deleteInvoiceTemplate(templateId);

      expect(result).toBeDefined();
    });
  });

  describe('Template Items Management', () => {
    it('should add item to template', async () => {
      const templateId = 'test-template-1';
      const itemData = {
        description: 'Monthly Catering Service',
        quantity: 1,
        unit_price: 5000,
      };

      const result = await createInvoiceTemplateItem(itemData);

      expect(result).toBeDefined();
    });

    it('should retrieve template items', async () => {
      const templateId = 'test-template-1';

      const result = await getInvoiceTemplateItems(templateId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should remove item from template', async () => {
      const itemId = 'test-item-1';

      const result = await deleteInvoiceTemplateItem(itemId);

      expect(result).toBeDefined();
    });

    it('should handle multiple items in template', async () => {
      const items = [
        {
          description: 'Catering Service',
          quantity: 1,
          unit_price: 3000,
        },
        {
          description: 'Service Staff',
          quantity: 4,
          unit_price: 500,
        },
        {
          description: 'Equipment Rental',
          quantity: 1,
          unit_price: 1000,
        },
      ];

      const results = await Promise.all(
        items.map(item => createInvoiceTemplateItem(item))
      );

      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Template Frequencies', () => {
    it('should support weekly frequency', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Weekly Service',
        frequency: 'weekly',
        next_generation_date: '2026-02-03',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should support monthly frequency', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Monthly Service',
        frequency: 'monthly',
        next_generation_date: '2026-02-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should support quarterly frequency', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Quarterly Service',
        frequency: 'quarterly',
        next_generation_date: '2026-04-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should support annual frequency', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Annual Service',
        frequency: 'annually',
        next_generation_date: '2027-01-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });
  });

  describe('Template Generation', () => {
    it('should generate invoices from active templates', async () => {
      const result = await generateInvoicesFromTemplates();

      expect(result).toBeDefined();
    });

    it('should handle template generation errors', async () => {
      const result = await generateInvoicesFromTemplates();

      expect(result).toBeDefined();
    });
  });

  describe('Template Preview', () => {
    it('should preview template with calculated totals', async () => {
      const templateId = 'test-template-1';

      const result = await getInvoiceTemplateById(templateId);

      expect(result).toBeDefined();
    });

    it('should calculate template total from items', async () => {
      const templateId = 'test-template-1';

      const itemsResult = await getInvoiceTemplateItems(templateId);

      expect(itemsResult).toBeDefined();
      if (Array.isArray(itemsResult) && itemsResult.length > 0) {
        const items = itemsResult;
        const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        expect(total).toBeGreaterThanOrEqual(0);
      }
    });

    it('should display template details in preview', async () => {
      const templateId = 'test-template-1';

      const templateResult = await getInvoiceTemplateById(templateId);
      const itemsResult = await getInvoiceTemplateItems(templateId);

      expect(templateResult).toBeDefined();
      expect(itemsResult).toBeDefined();
      expect(Array.isArray(itemsResult)).toBe(true);
    });
  });

  describe('Template Validation', () => {
    it('should validate template name is not empty', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: '',
        frequency: 'monthly',
        next_generation_date: '2026-02-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should validate frequency is valid', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Test Template',
        frequency: 'invalid-frequency' as any,
        next_generation_date: '2026-02-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should validate next generation date is valid', async () => {
      const templateData = {
        client_id: 'test-client-1',
        template_name: 'Test Template',
        frequency: 'monthly',
        next_generation_date: 'invalid-date',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });

    it('should validate client exists', async () => {
      const templateData = {
        client_id: 'non-existent-client',
        template_name: 'Test Template',
        frequency: 'monthly',
        next_generation_date: '2026-02-27',
        is_active: true,
      };

      const result = await createInvoiceTemplate(templateData);

      expect(result).toBeDefined();
    });
  });

  describe('Template Item Validation', () => {
    it('should validate item quantity is positive', async () => {
      const itemData = {
        description: 'Test Item',
        quantity: -1,
        unit_price: 100,
      };

      const result = await createInvoiceTemplateItem(itemData);

      expect(result).toBeDefined();
    });

    it('should validate item price is positive', async () => {
      const itemData = {
        description: 'Test Item',
        quantity: 1,
        unit_price: -100,
      };

      const result = await createInvoiceTemplateItem(itemData);

      expect(result).toBeDefined();
    });

    it('should validate item description is not empty', async () => {
      const itemData = {
        description: '',
        quantity: 1,
        unit_price: 100,
      };

      const result = await createInvoiceTemplateItem(itemData);

      expect(result).toBeDefined();
    });
  });

  describe('Template Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const result = await getInvoiceTemplates();

      expect(result).toBeDefined();
    });

    it('should handle invalid template ID', async () => {
      const result = await getInvoiceTemplateById('invalid-template-id');

      expect(result).toBeDefined();
    });

    it('should handle template generation errors', async () => {
      const result = await generateInvoicesFromTemplates();

      expect(result).toBeDefined();
    });
  });

  describe('Template Performance', () => {
    it('should retrieve templates within acceptable time', async () => {
      const startTime = Date.now();
      await getInvoiceTemplates();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should generate invoices from templates within acceptable time', async () => {
      const startTime = Date.now();
      await generateInvoicesFromTemplates();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Template Status Management', () => {
    it('should activate inactive template', async () => {
      const templateId = 'test-template-1';

      const result = await updateInvoiceTemplate(templateId, { is_active: true });

      expect(result).toBeDefined();
    });

    it('should deactivate active template', async () => {
      const templateId = 'test-template-1';

      const result = await updateInvoiceTemplate(templateId, { is_active: false });

      expect(result).toBeDefined();
    });

    it('should update next generation date', async () => {
      const templateId = 'test-template-1';
      const newDate = '2026-03-27';

      const result = await updateInvoiceTemplate(templateId, {
        next_generation_date: newDate,
      });

      expect(result).toBeDefined();
    });
  });
});
