import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { Expense, ExpenseInput } from '../../types';

const { service } = vi.hoisted(() => ({
  service: {
    postExpense: vi.fn(),
    patchExpense: vi.fn(),
    deleteExpense: vi.fn(),
  },
}));

vi.mock('@/features/expenses/hooks/useExpenses', () => ({
  default: () => service,
}));

import usePostExpense from '../usePostExpense';
import usePatchExpense from '../usePatchExpense';
import useDeleteExpense from '../useDeleteExpense';

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  userId: 'u1',
  budgetId: 'b1',
  amount: '25.00',
  date: '2026-04-01',
  description: 'Groceries',
  sourceType: 'MANUAL',
  sourceTemplateId: null,
  generationMonth: null,
  personId: null,
  splits: [{ id: 's1', categoryId: 'c1', amount: '25.00', description: null }],
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  ...overrides,
});

const input: ExpenseInput = {
  amount: '30.00',
  date: '2026-04-02',
  description: 'Lunch',
  splits: [{ categoryId: 'c1', amount: '30.00', description: null }],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('expense mutation hooks', () => {
  beforeEach(() => {
    service.postExpense.mockReset().mockResolvedValue('new-id');
    service.patchExpense.mockReset().mockResolvedValue('e1');
    service.deleteExpense.mockReset().mockResolvedValue(true);
  });

  it('usePostExpense forwards the budget, user, and input', async () => {
    const onSettled = vi.fn();
    const { result } = renderHook(() => usePostExpense({ onSettled }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ budgetId: 'b1', userId: 'u1', expense: input });
    });

    expect(service.postExpense).toHaveBeenCalledWith('b1', 'u1', input);
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it('usePatchExpense forwards the edited expense', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => usePatchExpense({ onSuccess }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ expense: expense({ amount: '30.00' }) });
    });

    expect(service.patchExpense).toHaveBeenCalledWith(expense({ amount: '30.00' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('useDeleteExpense forwards only the expense id', async () => {
    const { result } = renderHook(() => useDeleteExpense(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ expense: expense() });
    });

    expect(service.deleteExpense).toHaveBeenCalledWith('e1');
  });

  it('surfaces service errors through the mutation state', async () => {
    service.postExpense.mockRejectedValue(new Error('budget closed'));

    const { result } = renderHook(() => usePostExpense(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ budgetId: 'b1', userId: 'u1', expense: input }),
      ).rejects.toThrow('budget closed');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
