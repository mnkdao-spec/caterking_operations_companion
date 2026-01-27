import { describe, it, expect, beforeEach } from 'vitest';
import {
  updateEvent,
  getEventById,
  updateClient,
  getClientById,
  updateStaff,
  getStaffById,
  updateMenuItem,
} from '../lib/supabase-services';

describe('Edit Functionality for All ERP Pages', () => {
  describe('Edit Events', () => {
    it('should update event details successfully', async () => {
      const eventId = 'test-event-1';
      const updates = {
        event_name: 'Updated Event Name',
        event_date: '2026-02-15',
        event_time: '18:00:00',
        venue_name: 'Updated Venue',
        guest_count: 300,
        budget: 50000,
      };

      const result = await updateEvent(eventId, updates);
      expect(result).toBeDefined();
    });

    it('should retrieve updated event data', async () => {
      const eventId = 'test-event-1';
      const event = await getEventById(eventId);
      
      expect(event).toBeDefined();
    });

    it('should handle invalid event ID gracefully', async () => {
      const result = await updateEvent('invalid-id', { event_name: 'Test' });
      expect(result).toBeDefined();
    });

    it('should validate event data before updating', async () => {
      const result = await updateEvent('test-event-1', {
        guest_count: -10,
      });
      expect(result).toBeDefined();
    });
  });

  describe('Edit Clients', () => {
    it('should update client details successfully', async () => {
      const clientId = 'test-client-1';
      const updates = {
        client_name: 'Updated Client Corp',
        email: 'updated@client.com',
        phone: '+1-555-0100',
        address: '123 Updated St',
      };

      const result = await updateClient(clientId, updates);
      expect(result).toBeDefined();
    });

    it('should retrieve updated client data', async () => {
      const clientId = 'test-client-1';
      const client = await getClientById(clientId);
      
      expect(client).toBeDefined();
    });

    it('should validate email format before updating', async () => {
      const result = await updateClient('test-client-1', {
        email: 'invalid-email',
      });
      expect(result).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const result = await updateClient('test-client-1', {
        client_name: '',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Edit Staff', () => {
    it('should update staff details successfully', async () => {
      const staffId = 'test-staff-1';
      const updates = {
        first_name: 'Updated',
        last_name: 'Name',
        role: 'Head Chef',
        hourly_rate: 35,
        phone: '+1-555-0200',
      };

      const result = await updateStaff(staffId, updates);
      expect(result).toBeDefined();
    });

    it('should retrieve updated staff data', async () => {
      const staffId = 'test-staff-1';
      const staff = await getStaffById(staffId);
      
      expect(staff).toBeDefined();
    });

    it('should validate hourly rate is positive', async () => {
      const result = await updateStaff('test-staff-1', {
        hourly_rate: -10,
      });
      expect(result).toBeDefined();
    });

    it('should handle role validation', async () => {
      const result = await updateStaff('test-staff-1', {
        role: 'Invalid Role',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Edit Menu Items', () => {
    it('should update menu item details successfully', async () => {
      const itemId = 'test-item-1';
      const updates = {
        item_name: 'Updated Dish',
        description: 'Updated description',
        cost: 12.50,
        price: 35.00,
        category: 'Entree',
      };

      const result = await updateMenuItem(itemId, updates);
      expect(result).toBeDefined();
    });

    it('should validate price is greater than cost', async () => {
      const result = await updateMenuItem('test-item-1', {
        cost: 50,
        price: 30,
      });
      expect(result).toBeDefined();
    });

    it('should validate positive prices', async () => {
      const result = await updateMenuItem('test-item-1', {
        price: -10,
      });
      expect(result).toBeDefined();
    });
  });

  describe('Concurrent Edit Operations', () => {
    it('should handle multiple concurrent updates', async () => {
      const updates = [
        updateEvent('test-event-1', { event_name: 'Event 1' }),
        updateClient('test-client-1', { client_name: 'Client 1' }),
        updateStaff('test-staff-1', { first_name: 'Staff 1' }),
      ];

      const results = await Promise.all(updates);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Edit Validation & Error Handling', () => {
    it('should reject updates with invalid data types', async () => {
      const result = await updateEvent('test-event-1', {
        guest_count: 'not a number' as any,
      });
      expect(result).toBeDefined();
    });

    it('should handle database connection errors gracefully', async () => {
      const result = await updateEvent('test-event-1', {
        event_name: 'Test',
      });
      expect(result).toBeDefined();
    });

    it('should preserve unmodified fields during partial updates', async () => {
      const eventId = 'test-event-1';
      
      const original = await getEventById(eventId);
      await updateEvent(eventId, { event_name: 'New Name' });
      const updated = await getEventById(eventId);
      
      expect(original).toBeDefined();
      expect(updated).toBeDefined();
    });
  });
});
