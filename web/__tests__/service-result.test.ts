import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '../lib/services/clients';
import { supabase } from '../lib/supabase';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '1', client_name: 'Test' }, error: null }))
        }))
      }))
    }))
  }
}));

describe('ServiceResult Pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a success result when operation succeeds', async () => {
    const result = await createClient({ client_name: 'Test' });
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: '1', client_name: 'Test' });
    expect(result.error).toBeNull();
  });

  it('should return a failure result when operation fails', async () => {
    // Override mock for this test
    (supabase.from as any).mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB Error' } }))
        }))
      }))
    });

    const result = await createClient({ client_name: 'Test' });
    
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('DB Error');
  });
});
