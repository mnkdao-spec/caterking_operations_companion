import { vi } from 'vitest';

// Global Supabase Mock
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
};

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock window.confirm
if (typeof window !== 'undefined') {
  window.confirm = vi.fn(() => true);
}

// Mock window.alert
if (typeof window !== 'undefined') {
  window.alert = vi.fn();
}