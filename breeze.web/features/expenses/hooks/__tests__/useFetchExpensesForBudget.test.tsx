import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { getExpensesForBudget } = vi.hoisted(() => ({ getExpensesForBudget: vi.fn() }));

vi.mock('../index', () => ({
  useExpenses: () => ({ getExpensesForBudget }),
}));

import useFetchExpensesForBudget from '../useFetchExpensesForBudget';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useFetchExpensesForBudget', () => {
  beforeEach(() => {
    getExpensesForBudget.mockReset();
  });

  it('loads expenses for the budget', async () => {
    const expenses = [{ id: 'e1', description: 'Groceries' }];
    getExpensesForBudget.mockResolvedValue(expenses);

    const { result } = renderHook(
      () => useFetchExpensesForBudget({ budgetId: 'b1', enabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data).toEqual(expenses));
    expect(getExpensesForBudget).toHaveBeenCalledWith('b1');
  });

  it('does not fetch while disabled', () => {
    const { result } = renderHook(
      () => useFetchExpensesForBudget({ budgetId: 'b1', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getExpensesForBudget).not.toHaveBeenCalled();
  });
});
