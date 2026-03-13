import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../lib/supabase-client';

describe('useAuth hook (Real Integration)', () => {
  it('should initialize and reach a non-loading state with real Supabase', async () => {
    // Ensure supabase is configured (it should be now in .env)
    expect(supabase).not.toBeNull();
    
    const { result } = renderHook(() => useAuth());
    
    // It should eventually stop loading
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 10000 });
    
    // In a test environment without a real user session, it should be null
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should be able to reach Supabase auth service', async () => {
    const { data, error } = await supabase!.auth.getSession();
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});