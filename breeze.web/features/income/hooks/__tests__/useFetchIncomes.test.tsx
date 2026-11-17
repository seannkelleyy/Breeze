import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { getIncomes } = vi.hoisted(() => ({ getIncomes: vi.fn() }));

vi.mock('@/features/income/hooks/index', () => ({
  useIncomes: () => ({ getIncomes }),
}));

import useFetchIncomes from '../useFetchIncomes';
import type { Income } from '../../types';

const income = (overrides: Partial<Income> = {}): Income => ({
  id: 'i1',
  userId: 'u1',
  budgetId: 'b1',
  name: 'Salary',
  amount: '5000.00',
  date: '2026-03-15',
  sourceType: 'MANUAL',
  sourceTemplateId: null,
  sourceOccurrenceDate: null,
  generationMonth: null,
  personId: null,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useFetchIncomes', () => {
  beforeEach(() => {
    getIncomes.mockReset();
  });

  it('loads incomes for the budget', async () => {
    getIncomes.mockResolvedValue([income()]);

    const { result } = renderHook(() => useFetchIncomes({ budgetId: 'b1', enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getIncomes).toHaveBeenCalledWith('b1');
    expect(result.current.data).toEqual([income()]);
  });

  it('skips the request when disabled', async () => {
    const { result } = renderHook(() => useFetchIncomes({ budgetId: 'b1', enabled: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));

    expect(getIncomes).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});
