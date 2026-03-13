import { vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    mergeItem: vi.fn(),
    clear: vi.fn(),
    getAllKeys: vi.fn(),
    flushGetRequests: vi.fn(),
    multiGet: vi.fn(),
    multiSet: vi.fn(),
    multiRemove: vi.fn(),
    multiMerge: vi.fn(),
  },
}));

// Polyfill window.localStorage for Supabase Auth in jsdom
if (typeof window !== 'undefined' && !window.localStorage) {
  const mockStorage: Record<string, string> = {};
  (window as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const key in mockStorage) delete mockStorage[key]; },
    length: 0,
    key: (index: number) => Object.keys(mockStorage)[index] || null,
  };
}
