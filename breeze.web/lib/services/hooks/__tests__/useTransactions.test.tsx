import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import useTransactions, { type BankTransaction } from '../useTransactions';

const transactionDto = (overrides: Record<string, unknown> = {}) => ({
  id: 't1',
  plaidAccountId: 'acc1',
  plaidTransactionId: 'plaid-1',
  date: '2026-09-15',
  amount: '42.50',
  name: 'Whole Foods',
  expenseCategoryId: null,
  pending: false,
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

describe('useTransactions', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('maps DTOs: amount string becomes a number, invalid amounts become 0', async () => {
    requestMock.mockResolvedValue({
      transactions: [
        transactionDto({ amount: '42.50' }),
        transactionDto({ id: 't2', amount: 'not-a-number' }),
        transactionDto({ id: 't3', amount: '-19.99', name: 'Deposit' }),
      ],
    });

    const { result } = renderHook(() => useTransactions('u1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const transactions = result.current.transactions;
    expect(transactions).toHaveLength(3);
    expect(transactions[0].amount).toBe(42.5);
    expect(transactions[1].amount).toBe(0);
    expect(transactions[2].amount).toBe(-19.99);
    expect(transactions[0].plaidAccountId).toBe('acc1');
    expect(transactions[0].expenseCategoryId).toBeNull();
  });

  it('passes the user and date range to the query', async () => {
    requestMock.mockResolvedValue({ transactions: [] });

    const { result } = renderHook(() => useTransactions('u1', 3), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const [query, variables] = requestMock.mock.calls[0];
    expect(query).toContain('transactions');
    expect(variables.userId).toBe('u1');
    expect(variables.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(variables.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not fetch without a user', () => {
    const { result } = renderHook(() => useTransactions(null), { wrapper: createWrapper() });

    expect(result.current.transactions).toEqual([]);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('assignCategory updates the cached transaction in place', async () => {
    requestMock.mockResolvedValueOnce({ transactions: [transactionDto()] }).mockResolvedValueOnce({
      assignTransactionCategory: { id: 't1', expenseCategoryId: 'cat9' },
    });

    const { result } = renderHook(() => useTransactions('u1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.transactions).toHaveLength(1));

    act(() => result.current.assignCategory.mutate({ id: 't1', categoryId: 'cat9' }));

    await waitFor(() => expect(result.current.transactions[0].expenseCategoryId).toBe('cat9'));
  });

  it('assignCategory can clear a category with null', async () => {
    requestMock
      .mockResolvedValueOnce({ transactions: [transactionDto({ expenseCategoryId: 'cat1' })] })
      .mockResolvedValueOnce({ assignTransactionCategory: { id: 't1', expenseCategoryId: null } });

    const { result } = renderHook(() => useTransactions('u1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.transactions[0].expenseCategoryId).toBe('cat1'));

    act(() => result.current.assignCategory.mutate({ id: 't1', categoryId: null }));

    await waitFor(() => expect(result.current.transactions[0].expenseCategoryId).toBeNull());
  });

  it('removeTransaction filters the cached list', async () => {
    requestMock
      .mockResolvedValueOnce({
        transactions: [transactionDto(), transactionDto({ id: 't2', name: 'Other' })],
      })
      .mockResolvedValueOnce({ deleteTransaction: true });

    const { result } = renderHook(() => useTransactions('u1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.transactions).toHaveLength(2));

    act(() => result.current.removeTransaction.mutate('t1'));

    await waitFor(() => expect(result.current.transactions).toHaveLength(1));
    expect(result.current.transactions[0].id).toBe('t2');
  });

  it('surfaces a failed query as isError with an empty list', async () => {
    requestMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useTransactions('u1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.transactions).toEqual([] as BankTransaction[]);
  });
});
