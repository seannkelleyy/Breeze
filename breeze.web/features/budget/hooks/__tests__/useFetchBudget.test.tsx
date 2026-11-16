import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';

const { getBudget, regenerateBudgetMonth } = vi.hoisted(() => ({
  getBudget: vi.fn(),
  regenerateBudgetMonth: vi.fn(),
}));

vi.mock('@/features/budget/hooks/index', () => ({
  useBudgets: () => ({ getBudget }),
}));

vi.mock('@/features/budget/hooks/useRegenerateBudget', () => ({
  useRegenerateBudget: () => ({ regenerateBudgetMonth }),
}));

import { useFetchBudget } from '../useFetchBudget';

const budget = {
  id: 'b1',
  userId: 'u1',
  monthlyIncome: '5000.00',
  monthlyExpenses: '3500.00',
  date: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useFetchBudget', () => {
  beforeEach(() => {
    getBudget.mockReset();
    regenerateBudgetMonth.mockReset().mockResolvedValue(undefined);
  });

  it('returns the existing budget without regenerating the month', async () => {
    getBudget.mockResolvedValue(budget);

    const { result } = renderHook(() => useFetchBudget({ date: dayjs('2026-03-15') }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBudget).toHaveBeenCalledWith(2026, 3);
    expect(regenerateBudgetMonth).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(budget);
  });

  it('materializes and refetches a month that has no budget yet', async () => {
    getBudget.mockResolvedValueOnce(null).mockResolvedValueOnce(budget);

    const { result } = renderHook(() => useFetchBudget({ date: dayjs('2026-04-02') }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(regenerateBudgetMonth).toHaveBeenCalledWith(2026, 4);
    expect(getBudget).toHaveBeenCalledTimes(2);
    expect(getBudget).toHaveBeenNthCalledWith(2, 2026, 4);
    expect(result.current.data).toEqual(budget);
  });
});
