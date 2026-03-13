import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCrudList } from '../hooks/use-crud-list';

describe('useCrudList Hook', () => {
  const mockFetch = vi.fn();
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and display items', async () => {
    const mockData = [{ id: '1', name: 'Test Item' }];
    mockFetch.mockResolvedValue(mockData);

    const { result } = renderHook(() => 
      useCrudList({ 
        fetchFn: mockFetch,
        deleteFn: mockDelete
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle deletion', async () => {
    const mockData = [{ id: '1', name: 'Test Item' }];
    mockFetch.mockResolvedValue(mockData);
    mockDelete.mockResolvedValue({ success: true });

    const { result } = renderHook(() => 
      useCrudList({ 
        fetchFn: mockFetch,
        deleteFn: mockDelete
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.handleDelete('1', 'Test Item');

    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + reload
  });
});
