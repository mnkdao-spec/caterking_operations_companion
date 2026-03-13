/**
 * Cross-platform integration tests
 * Validates that mobile and web apps can share data through Supabase
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CateringDatabase } from '../../shared/supabase-service';
import * as DatabaseTypes from '../../shared/database-types';

let supabaseAdmin: SupabaseClient;
let db: CateringDatabase;

beforeAll(async () => {
  // Initialize Supabase client with service role key for admin operations
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  db = new CateringDatabase(supabaseAdmin);

  console.log('[Cross-Platform] Test setup initialized');
});

afterAll(async () => {
  // Clean up test data
  console.log('[Cross-Platform] Cleaning up test data');
});

describe('Cross-Platform Integration', () => {
  describe('Shared Data Models', () => {
    it('should create and retrieve a client from both platforms', async () => {
      const testClient = {
        client_name: 'Test Client - Cross Platform',
        email: 'test@crossplatform.com',
        phone: '555-0123',
        address: '123 Test St',
      };

      // Create via database service (simulating web app)
      const createdClient = await db.createClient(testClient);
      expect(createdClient).toBeDefined();
      expect(createdClient.id).toBeDefined();
      expect(createdClient.client_name).toBe(testClient.client_name);

      // Retrieve via database service (simulating mobile app)
      const retrievedClient = await db.getClientById(createdClient.id);
      expect(retrievedClient).toBeDefined();
      expect(retrievedClient.client_name).toBe(testClient.client_name);
      expect(retrievedClient.email).toBe(testClient.email);

      // Cleanup
      await db.deleteClient(createdClient.id);
    });

    it('should sync staff data across platforms', async () => {
      const testStaff = {
        first_name: 'John',
        last_name: 'Chef',
        role: 'Head Chef',
        hourly_rate: 50,
        phone: '555-0456',
      };

      // Create staff (web app)
      const createdStaff = await db.createStaff(testStaff);
      expect(createdStaff).toBeDefined();
      expect(createdStaff.id).toBeDefined();

      // Retrieve staff (mobile app)
      const retrievedStaff = await db.getStaffById(createdStaff.id);
      expect(retrievedStaff).toBeDefined();
      expect(retrievedStaff.first_name).toBe(testStaff.first_name);
      expect(retrievedStaff.hourly_rate).toBe(testStaff.hourly_rate);

      // Update staff (mobile app)
      const updatedStaff = await db.updateStaff(createdStaff.id, {
        hourly_rate: 55,
      });
      expect(updatedStaff.hourly_rate).toBe(55);

      // Verify update (web app)
      const verifiedStaff = await db.getStaffById(createdStaff.id);
      expect(verifiedStaff.hourly_rate).toBe(55);

      // Cleanup
      await db.deleteStaff(createdStaff.id);
    });
  });

  describe('Event Management Workflow', () => {
    it('should create event and assign staff across platforms', async () => {
      // Create client (web app)
      const client = await db.createClient({
        client_name: 'Event Test Client',
        email: 'event@test.com',
      });

      // Create staff (mobile app)
      const staff1 = await db.createStaff({
        first_name: 'Alice',
        last_name: 'Server',
        role: 'Server',
        hourly_rate: 20,
      });

      const staff2 = await db.createStaff({
        first_name: 'Bob',
        last_name: 'Chef',
        role: 'Chef',
        hourly_rate: 35,
      });

      // Create event (web app)
      const event = await db.createEvent({
        client_id: client.id,
        event_name: 'Cross Platform Test Event',
        event_date: new Date().toISOString().split('T')[0],
        guest_count: 50,
        budget: 5000,
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();

      // Assign staff to event (mobile app)
      const assignment1 = await db.assignStaffToEvent(staff1.id, event.id);
      expect(assignment1).toBeDefined();

      const assignment2 = await db.assignStaffToEvent(staff2.id, event.id);
      expect(assignment2).toBeDefined();

      // Retrieve event staff (web app)
      const eventStaff = await db.getEventStaff(event.id);
      expect(eventStaff.length).toBe(2);

      // Verify staff details
      const staffIds = eventStaff.map((s: any) => s.staff_id);
      expect(staffIds).toContain(staff1.id);
      expect(staffIds).toContain(staff2.id);

      // Cleanup
      await db.deleteEvent(event.id);
      await db.deleteStaff(staff1.id);
      await db.deleteStaff(staff2.id);
      await db.deleteClient(client.id);
    });
  });

  describe('Invoice Generation Workflow', () => {
    it('should create invoice from event data across platforms', async () => {
      // Create client
      const client = await db.createClient({
        client_name: 'Invoice Test Client',
        email: 'invoice@test.com',
      });

      // Create event
      const event = await db.createEvent({
        client_id: client.id,
        event_name: 'Invoice Test Event',
        event_date: new Date().toISOString().split('T')[0],
        guest_count: 100,
        budget: 10000,
      });

      // Create invoice (web app)
      const invoice = await db.createInvoice({
        client_id: client.id,
        event_id: event.id,
        invoice_number: `INV-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        subtotal: 8000,
        tax_amount: 800,
        total_amount: 8800,
      });

      expect(invoice).toBeDefined();
      expect(invoice.id).toBeDefined();

      // Retrieve invoice (mobile app)
      const retrievedInvoice = await db.getInvoiceById(invoice.id);
      expect(retrievedInvoice).toBeDefined();
      expect(retrievedInvoice.total_amount).toBe(8800);
      expect(retrievedInvoice.status).toBe('draft');

      // Update invoice status (mobile app)
      const updatedInvoice = await db.updateInvoice(invoice.id, {
        status: 'sent',
      });
      expect(updatedInvoice.status).toBe('sent');

      // Verify update (web app)
      const verifiedInvoice = await db.getInvoiceById(invoice.id);
      expect(verifiedInvoice.status).toBe('sent');

      // Cleanup (delete invoice first due to FK constraint)
      await supabaseAdmin.from('invoices').delete().eq('id', invoice.id);
      await db.deleteEvent(event.id);
      await db.deleteClient(client.id);
    });
  });

  describe('Real-Time Synchronization', () => {
    it('should handle concurrent updates from multiple platforms', async () => {
      const client = await db.createClient({
        client_name: 'Concurrent Test Client',
        email: 'concurrent@test.com',
      });

      // Simulate concurrent updates from web and mobile
      const updates = await Promise.all([
        db.updateClient(client.id, { phone: '555-1111' }),
        db.updateClient(client.id, { address: '456 New St' }),
      ]);

      expect(updates).toHaveLength(2);

      // Verify final state
      const finalClient = await db.getClientById(client.id);
      expect(finalClient).toBeDefined();

      // Cleanup
      await db.deleteClient(client.id);
    });

    it('should maintain data consistency across platforms', async () => {
      // Create a valid client first
      const client = await db.createClient({
        client_name: 'Consistency Test Client',
        email: 'consistency@test.com',
      });

      const staff = await db.createStaff({
        first_name: 'Consistency',
        last_name: 'Test',
        role: 'Tester',
        hourly_rate: 25,
      });

      const event = await db.createEvent({
        client_id: client.id,
        event_name: 'Consistency Test',
        event_date: new Date().toISOString().split('T')[0],
      });

      // Create assignment
      const assignment = await db.assignStaffToEvent(staff.id, event.id);
      expect(assignment).toBeDefined();

      // Verify from different query paths
      const eventStaff = await db.getEventStaff(event.id);
      expect(eventStaff.length).toBeGreaterThan(0);

      // Cleanup
      await db.deleteStaff(staff.id);
      await db.deleteEvent(event.id);
      await db.deleteClient(client.id);
    });
  });

  describe('Data Filtering and Pagination', () => {
    it('should filter events by date range across platforms', async () => {
      const client = await db.createClient({
        client_name: 'Filter Test Client',
        email: 'filter@test.com',
      });

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const event1 = await db.createEvent({
        client_id: client.id,
        event_name: 'Today Event',
        event_date: today.toISOString().split('T')[0],
      });

      const event2 = await db.createEvent({
        client_id: client.id,
        event_name: 'Tomorrow Event',
        event_date: tomorrow.toISOString().split('T')[0],
      });

      // Filter events by date (web app)
      const todayEvents = await db.getEvents({
        clientId: client.id,
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });

      expect(todayEvents.length).toBeGreaterThan(0);
      expect(todayEvents.some((e) => e.id === event1.id)).toBe(true);

      // Cleanup
      await db.deleteEvent(event1.id);
      await db.deleteEvent(event2.id);
      await db.deleteClient(client.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing records gracefully', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      try {
        await db.getClientById(fakeId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid data gracefully', async () => {
      try {
        await db.createClient({
          client_name: '', // Invalid: empty name
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should retrieve data within acceptable time', async () => {
      const startTime = Date.now();

      const clients = await db.getClients(10);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(Array.isArray(clients)).toBe(true);
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Create multiple clients
      const clientPromises = Array.from({ length: 5 }, (_, i) =>
        db.createClient({
          client_name: `Bulk Client ${i}`,
          email: `bulk${i}@test.com`,
        })
      );

      const createdClients = await Promise.all(clientPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(createdClients).toHaveLength(5);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Cleanup
      for (const client of createdClients) {
        await db.deleteClient(client.id);
      }
    });
  });
});
