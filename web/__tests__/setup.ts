import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Test fixtures for integration tests
 */
export const testFixtures = {
  client: {
    id: 'test-client-' + Date.now(),
    client_name: 'Test Catering Client',
    email: 'test@example.com',
    phone: '+1-555-0100',
    address: '123 Test Street',
  },
  staff: {
    id: 'test-staff-' + Date.now(),
    first_name: 'Test',
    last_name: 'Staff',
    role: 'Chef',
    hourly_rate: 50,
    phone: '+1-555-0200',
  },
  event: {
    id: 'test-event-' + Date.now(),
    event_name: 'Test Catering Event',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: '18:00:00',
    venue_name: 'Test Venue',
    guest_count: 100,
    budget: 10000,
  },
  menu_item: {
    id: 'test-menu-' + Date.now(),
    name: 'Test Dish',
    description: 'A test menu item',
    cost: 10,
    price: 25,
    category: 'Main Course',
  },
};

/**
 * Check if a table exists in Supabase
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .select('id')
      .limit(1);

    if (error?.code === 'PGRST205') {
      // Table not found
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Get all table names from the database
 */
export async function getTableNames(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_tables', {});

    if (error) {
      console.error('Error fetching tables:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getTableNames:', err);
    return [];
  }
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData() {
  try {
    // Delete test records from all tables
    const tables = ['events', 'staff_assignments', 'staff', 'clients', 'menu_items'];

    for (const table of tables) {
      const exists = await tableExists(table);
      if (exists) {
        await supabaseAdmin
          .from(table)
          .delete()
          .like('id', 'test-%');
      }
    }

    console.log('Test data cleaned up');
  } catch (err) {
    console.error('Error cleaning up test data:', err);
  }
}

/**
 * Create test client in database
 */
export async function createTestClient() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert([testFixtures.client])
      .select()
      .single();

    if (error) {
      console.error('Error creating test client:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createTestClient:', err);
    return null;
  }
}

/**
 * Create test staff in database
 */
export async function createTestStaff() {
  try {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .insert([testFixtures.staff])
      .select()
      .single();

    if (error) {
      console.error('Error creating test staff:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createTestStaff:', err);
    return null;
  }
}

/**
 * Create test event in database
 */
export async function createTestEvent(clientId?: string) {
  try {
    const eventData = {
      ...testFixtures.event,
      client_id: clientId,
    };

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error('Error creating test event:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createTestEvent:', err);
    return null;
  }
}

/**
 * Create test menu item in database
 */
export async function createTestMenuItem() {
  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert([testFixtures.menu_item])
      .select()
      .single();

    if (error) {
      console.error('Error creating test menu item:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createTestMenuItem:', err);
    return null;
  }
}

/**
 * Create staff assignment in database
 */
export async function createTestAssignment(staffId: string, eventId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('staff_assignments')
      .insert([{
        id: 'test-assignment-' + Date.now(),
        staff_id: staffId,
        event_id: eventId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating test assignment:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createTestAssignment:', err);
    return null;
  }
}

/**
 * Create invoice template in database
 */
export async function createTestInvoiceTemplate(clientId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_templates')
      .insert([{
        id: 'test-template-' + Date.now(),
        client_id: clientId,
        template_name: 'Test Invoice Template',
        frequency: 'monthly',
        next_generation_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating test invoice template:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createTestInvoiceTemplate:', err);
    return null;
  }
}
