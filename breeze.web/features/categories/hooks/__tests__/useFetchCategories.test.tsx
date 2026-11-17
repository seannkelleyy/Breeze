import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { getCategories } = vi.hoisted(() => ({ getCategories: vi.fn() }));

vi.mock('../index', () => ({
  useCategories: () => ({ getCategories }),
}));

import useFetchCategories from '../useFetchCategories';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useFetchCategories', () => {
  beforeEach(() => {
    getCategories.mockReset();
  });

  it('loads categories for the budget', async () => {
    const categories = [{ id: 'c1', name: 'Groceries' }];
    getCategories.mockResolvedValue(categories);

    const { result } = renderHook(() => useFetchCategories({ budgetId: 'b1', enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(categories));
    expect(getCategories).toHaveBeenCalledWith('b1');
  });

  it('does not fetch while disabled', () => {
    const { result } = renderHook(() => useFetchCategories({ budgetId: 'b1', enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getCategories).not.toHaveBeenCalled();
  });
});
