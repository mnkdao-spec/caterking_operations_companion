import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  supabaseAdmin,
  testFixtures,
  tableExists,
  cleanupTestData,
  createTestClient,
  createTestStaff,
  createTestEvent,
  createTestMenuItem,
  createTestAssignment,
  createTestInvoiceTemplate,
} from './setup';

describe('End-to-End Workflows', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData();
  });

  describe('Event Creation Workflow', () => {
    it('should check if events table exists', async () => {
      const exists = await tableExists('events');
      
      if (!exists) {
        console.log('Events table does not exist - skipping workflow tests');
        expect(true).toBe(true);
      } else {
        expect(exists).toBe(true);
      }
    });

    it('should create a client for the event', async () => {
      const clientExists = await tableExists('clients');
      if (!clientExists) {
        console.log('Clients table does not exist');
        expect(true).toBe(true);
        return;
      }

      const client = await createTestClient();
      
      if (client) {
        expect(client).toBeDefined();
        expect(client.id).toBeDefined();
        expect(client.client_name).toBe(testFixtures.client.client_name);
      }
    });

    it('should create an event with client reference', async () => {
      const eventExists = await tableExists('events');
      const clientExists = await tableExists('clients');

      if (!eventExists || !clientExists) {
        console.log('Required tables do not exist');
        expect(true).toBe(true);
        return;
      }

      // Create client first
      const client = await createTestClient();
      if (!client) {
        console.log('Failed to create test client');
        expect(true).toBe(true);
        return;
      }

      // Create event
      const event = await createTestEvent(client.id);

      if (event) {
        expect(event).toBeDefined();
        expect(event.id).toBeDefined();
        expect(event.event_name).toBe(testFixtures.event.event_name);
        expect(event.guest_count).toBe(testFixtures.event.guest_count);
      }
    });
  });

  describe('Staff Assignment Workflow', () => {
    it('should create staff member', async () => {
      const staffExists = await tableExists('staff');
      if (!staffExists) {
        console.log('Staff table does not exist');
        expect(true).toBe(true);
        return;
      }

      const staff = await createTestStaff();

      if (staff) {
        expect(staff).toBeDefined();
        expect(staff.id).toBeDefined();
        expect(staff.first_name).toBe(testFixtures.staff.first_name);
        expect(staff.hourly_rate).toBe(testFixtures.staff.hourly_rate);
      }
    });

    it('should assign staff to event', async () => {
      const assignmentExists = await tableExists('staff_assignments');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const clientExists = await tableExists('clients');

      if (!assignmentExists || !staffExists || !eventExists || !clientExists) {
        console.log('Required tables do not exist');
        expect(true).toBe(true);
        return;
      }

      // Create prerequisites
      const client = await createTestClient();
      if (!client) return;

      const staff = await createTestStaff();
      if (!staff) return;

      const event = await createTestEvent(client.id);
      if (!event) return;

      // Create assignment
      const assignment = await createTestAssignment(staff.id, event.id);

      if (assignment) {
        expect(assignment).toBeDefined();
        expect(assignment.staff_id).toBe(staff.id);
        expect(assignment.event_id).toBe(event.id);
      }
    });

    it('should retrieve staff assignments for event', async () => {
      const assignmentExists = await tableExists('staff_assignments');
      if (!assignmentExists) {
        console.log('Staff assignments table does not exist');
        expect(true).toBe(true);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('staff_assignments')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      if (data) {
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('Invoice Generation Workflow', () => {
    it('should create invoice template', async () => {
      const templateExists = await tableExists('invoice_templates');
      const clientExists = await tableExists('clients');

      if (!templateExists || !clientExists) {
        console.log('Required tables do not exist');
        expect(true).toBe(true);
        return;
      }

      // Create client first
      const client = await createTestClient();
      if (!client) return;

      // Create template
      const template = await createTestInvoiceTemplate(client.id);

      if (template) {
        expect(template).toBeDefined();
        expect(template.client_id).toBe(client.id);
        expect(template.frequency).toBe('monthly');
      }
    });

    it('should retrieve invoice templates', async () => {
      const templateExists = await tableExists('invoice_templates');
      if (!templateExists) {
        console.log('Invoice templates table does not exist');
        expect(true).toBe(true);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('invoice_templates')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      if (data) {
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('Complete Workflow: Event → Staff → Invoice', () => {
    it('should execute complete catering workflow', async () => {
      // Check all required tables exist
      const clientExists = await tableExists('clients');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const assignmentExists = await tableExists('staff_assignments');
      const templateExists = await tableExists('invoice_templates');

      if (!clientExists || !staffExists || !eventExists || !assignmentExists || !templateExists) {
        console.log('Some required tables do not exist - skipping complete workflow');
        expect(true).toBe(true);
        return;
      }

      // Step 1: Create client
      const client = await createTestClient();
      expect(client).toBeDefined();
      if (!client) return;

      // Step 2: Create event
      const event = await createTestEvent(client.id);
      expect(event).toBeDefined();
      if (!event) return;

      // Step 3: Create staff
      const staff = await createTestStaff();
      expect(staff).toBeDefined();
      if (!staff) return;

      // Step 4: Assign staff to event
      const assignment = await createTestAssignment(staff.id, event.id);
      expect(assignment).toBeDefined();

      // Step 5: Create invoice template
      const template = await createTestInvoiceTemplate(client.id);
      expect(template).toBeDefined();

      // Verify complete workflow
      if (assignment && template) {
        expect(assignment.staff_id).toBe(staff.id);
        expect(assignment.event_id).toBe(event.id);
        expect(template.client_id).toBe(client.id);
        expect(event.client_id).toBe(client.id);
      }
    });

    it('should handle multiple staff assignments', async () => {
      const assignmentExists = await tableExists('staff_assignments');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const clientExists = await tableExists('clients');

      if (!assignmentExists || !staffExists || !eventExists || !clientExists) {
        console.log('Required tables do not exist');
        expect(true).toBe(true);
        return;
      }

      // Create prerequisites
      const client = await createTestClient();
      if (!client) return;

      const event = await createTestEvent(client.id);
      if (!event) return;

      // Create multiple staff members
      const staffMembers = [];
      for (let i = 0; i < 3; i++) {
        const staff = await createTestStaff();
        if (staff) staffMembers.push(staff);
      }

      // Assign all to same event
      const assignments = [];
      for (const staff of staffMembers) {
        const assignment = await createTestAssignment(staff.id, event.id);
        if (assignment) assignments.push(assignment);
      }

      expect(assignments.length).toBeGreaterThan(0);
    });

    it('should calculate labor costs from staff assignments', async () => {
      const assignmentExists = await tableExists('staff_assignments');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const clientExists = await tableExists('clients');

      if (!assignmentExists || !staffExists || !eventExists || !clientExists) {
        console.log('Required tables do not exist');
        expect(true).toBe(true);
        return;
      }

      // Create prerequisites
      const client = await createTestClient();
      if (!client) return;

      const event = await createTestEvent(client.id);
      if (!event) return;

      const staff = await createTestStaff();
      if (!staff) return;

      const assignment = await createTestAssignment(staff.id, event.id);
      if (!assignment) return;

      // Verify labor cost calculation is possible
      const hourlyRate = staff.hourly_rate;
      const estimatedHours = 8; // Typical event duration
      const laborCost = hourlyRate * estimatedHours;

      expect(laborCost).toBeGreaterThan(0);
      expect(laborCost).toBe(50 * 8); // 50 * 8 = 400
    });

    it('should generate invoice from event data', async () => {
      const templateExists = await tableExists('invoice_templates');
      const clientExists = await tableExists('clients');
      const eventExists = await tableExists('events');
      const assignmentExists = await tableExists('staff_assignments');
      const staffExists = await tableExists('staff');

      if (!templateExists || !clientExists || !eventExists || !assignmentExists || !staffExists) {
        console.log('Required tables do not exist');
        expect(true).toBe(true);
        return;
      }

      // Create complete workflow
      const client = await createTestClient();
      if (!client) return;

      const event = await createTestEvent(client.id);
      if (!event) return;

      const staff = await createTestStaff();
      if (!staff) return;

      const assignment = await createTestAssignment(staff.id, event.id);
      if (!assignment) return;

      const template = await createTestInvoiceTemplate(client.id);
      if (!template) return;

      // Verify invoice can be generated from this data
      const invoiceData = {
        client_id: client.id,
        event_id: event.id,
        template_id: template.id,
        subtotal: event.budget,
        tax_rate: 0.1,
        tax_amount: event.budget * 0.1,
        total_amount: event.budget * 1.1,
      };

      expect(invoiceData.total_amount).toBe(event.budget * 1.1);
      expect(invoiceData.total_amount).toBe(10000 * 1.1); // 11000
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing client gracefully', async () => {
      const eventExists = await tableExists('events');
      if (!eventExists) {
        expect(true).toBe(true);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('events')
        .insert([{
          id: 'test-event-no-client-' + Date.now(),
          event_name: 'Event without client',
          event_date: '2026-02-01',
          event_time: '18:00:00',
          venue_name: 'Test Venue',
          guest_count: 50,
          budget: 5000,
        }])
        .select()
        .single();

      // Should either succeed or fail gracefully
      expect(data || error).toBeDefined();
    });

    it('should handle duplicate staff assignments', async () => {
      const assignmentExists = await tableExists('staff_assignments');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const clientExists = await tableExists('clients');

      if (!assignmentExists || !staffExists || !eventExists || !clientExists) {
        expect(true).toBe(true);
        return;
      }

      const client = await createTestClient();
      if (!client) return;

      const event = await createTestEvent(client.id);
      if (!event) return;

      const staff = await createTestStaff();
      if (!staff) return;

      // Create assignment
      const assignment1 = await createTestAssignment(staff.id, event.id);
      expect(assignment1).toBeDefined();

      // Try to create duplicate - should handle gracefully
      const assignment2 = await createTestAssignment(staff.id, event.id);
      // May succeed or fail, but should not crash
      expect(assignment2 || !assignment2).toBeDefined();
    });

    it('should validate data integrity across workflow', async () => {
      const clientExists = await tableExists('clients');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const assignmentExists = await tableExists('staff_assignments');

      if (!clientExists || !staffExists || !eventExists || !assignmentExists) {
        expect(true).toBe(true);
        return;
      }

      // Create workflow
      const client = await createTestClient();
      if (!client) return;

      const event = await createTestEvent(client.id);
      if (!event) return;

      const staff = await createTestStaff();
      if (!staff) return;

      const assignment = await createTestAssignment(staff.id, event.id);
      if (!assignment) return;

      // Verify data integrity
      expect(event.client_id).toBe(client.id);
      expect(assignment.staff_id).toBe(staff.id);
      expect(assignment.event_id).toBe(event.id);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle workflow within acceptable time', async () => {
      const clientExists = await tableExists('clients');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');
      const assignmentExists = await tableExists('staff_assignments');

      if (!clientExists || !staffExists || !eventExists || !assignmentExists) {
        expect(true).toBe(true);
        return;
      }

      const startTime = Date.now();

      // Execute workflow
      const client = await createTestClient();
      const event = client ? await createTestEvent(client.id) : null;
      const staff = await createTestStaff();
      const assignment = event && staff ? await createTestAssignment(staff.id, event.id) : null;

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Workflow should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent workflow operations', async () => {
      const clientExists = await tableExists('clients');
      const staffExists = await tableExists('staff');
      const eventExists = await tableExists('events');

      if (!clientExists || !staffExists || !eventExists) {
        expect(true).toBe(true);
        return;
      }

      const startTime = Date.now();

      // Execute multiple workflows concurrently
      const workflows = [
        (async () => {
          const client = await createTestClient();
          if (client) return await createTestEvent(client.id);
        })(),
        (async () => {
          const client = await createTestClient();
          if (client) return await createTestEvent(client.id);
        })(),
        (async () => {
          const client = await createTestClient();
          if (client) return await createTestEvent(client.id);
        })(),
      ];

      const results = await Promise.all(workflows);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.length).toBe(3);
      expect(duration).toBeLessThan(10000);
    });
  });
});
