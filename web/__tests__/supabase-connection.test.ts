import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Supabase Connection Validation', () => {
  it('should connect to Supabase with valid credentials', async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();

    const client = createClient(supabaseUrl!, supabaseAnonKey!);

    // Test basic connection by fetching from a table
    const { data, error } = await client
      .from('events')
      .select('id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should connect with service role key for admin operations', async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseServiceRoleKey).toBeDefined();

    const client = createClient(supabaseUrl!, supabaseServiceRoleKey!);

    // Test admin connection
    const { data, error } = await client
      .from('events')
      .select('id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should validate all required environment variables are set', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();

    expect(process.env.SUPABASE_URL).not.toBe('');
    expect(process.env.SUPABASE_ANON_KEY).not.toBe('');
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).not.toBe('');
  });
});
