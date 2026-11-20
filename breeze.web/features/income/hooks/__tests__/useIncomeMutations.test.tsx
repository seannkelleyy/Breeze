import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { Income, IncomeInput } from '../../types';

const { service } = vi.hoisted(() => ({
  service: {
    postIncome: vi.fn(),
    patchIncome: vi.fn(),
    deleteIncome: vi.fn(),
  },
}));

vi.mock('@/features/income/hooks/useIncomes', () => ({
  default: () => service,
}));

import usePostIncome from '../usePostIncome';
import usePatchIncome from '../usePatchIncome';
import useDeleteIncome from '../useDeleteIncome';

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

const input: IncomeInput = { name: 'Bonus', amount: '1200.00', date: '2026-03-20' };

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('income mutation hooks', () => {
  beforeEach(() => {
    service.postIncome.mockReset().mockResolvedValue('new-id');
    service.patchIncome.mockReset().mockResolvedValue('i1');
    service.deleteIncome.mockReset().mockResolvedValue(true);
  });

  it('usePostIncome forwards the budget and input', async () => {
    const onSettled = vi.fn();
    const { result } = renderHook(() => usePostIncome({ onSettled }), {
      wrapper: createWrapper(),
    });

    let created: unknown;
    await act(async () => {
      created = await result.current.mutateAsync({ budgetId: 'b1', income: input });
    });

    expect(created).toBe('new-id');
    expect(service.postIncome).toHaveBeenCalledWith('b1', input);
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it('usePatchIncome forwards the edited income', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => usePatchIncome({ onSuccess }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ income: income({ amount: '5600.00' }) });
    });

    expect(service.patchIncome).toHaveBeenCalledWith(income({ amount: '5600.00' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('useDeleteIncome forwards only the income id', async () => {
    const { result } = renderHook(() => useDeleteIncome(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ income: income() });
    });

    expect(service.deleteIncome).toHaveBeenCalledWith('i1');
  });

  it('surfaces service errors through the mutation state', async () => {
    service.postIncome.mockRejectedValue(new Error('budget closed'));

    const { result } = renderHook(() => usePostIncome(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.mutateAsync({ budgetId: 'b1', income: input })).rejects.toThrow(
        'budget closed',
      );
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
