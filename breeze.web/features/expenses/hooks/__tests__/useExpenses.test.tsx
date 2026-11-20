import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { print } from 'graphql';

const { requestMock, userState } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  userState: { userId: 'u1' as string | null },
}));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

import useExpenses from '../useExpenses';

const expense = {
  id: 'e1',
  userId: 'u1',
  budgetId: 'b1',
  amount: '25.00',
  date: '2026-04-01',
  description: 'Groceries',
  splits: [{ id: 's1', categoryId: 'c1', amount: '25.00', description: null }],
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const operationName = (document: unknown) => print(document as never);

describe('useExpenses', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('lists expenses for a budget', async () => {
    requestMock.mockResolvedValue({ expenses: [expense] });
    const { result } = renderHook(() => useExpenses());

    await expect(result.current.getExpensesForBudget('b1')).resolves.toEqual([expense]);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { budgetId: 'b1' });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('GetExpensesByBudget');
  });

  it('returns an empty list when the API omits expenses', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderHook(() => useExpenses());

    await expect(result.current.getExpensesForBudget('b1')).resolves.toEqual([]);
  });

  it('creates an expense with mapped splits without a client-supplied user id', async () => {
    requestMock.mockResolvedValue({ createExpense: { id: 'new-id' } });
    const { result } = renderHook(() => useExpenses());

    const created = await result.current.postExpense('b1', {
      amount: '25.00',
      date: '2026-04-01',
      description: 'Groceries',
      splits: [{ categoryId: 'c1', amount: '25.00', description: 'Food' }],
    });

    expect(created).toBe('new-id');
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        budgetId: 'b1',
        amount: '25.00',
        date: '2026-04-01',
        description: 'Groceries',
        splits: [{ categoryId: 'c1', amount: '25.00', description: 'Food' }],
      },
    });
  });

  it('updates an expense', async () => {
    requestMock.mockResolvedValue({ updateExpense: { id: 'e1' } });
    const { result } = renderHook(() => useExpenses());

    const updated = await result.current.patchExpense({
      ...expense,
      amount: '30.00',
    } as never);

    expect(updated).toBe('e1');
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        id: 'e1',
        amount: '30.00',
        date: '2026-04-01',
        description: 'Groceries',
        splits: [{ categoryId: 'c1', amount: '25.00', description: null }],
      },
    });
  });

  it('deletes an expense', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderHook(() => useExpenses());

    await expect(result.current.deleteExpense('e1')).resolves.toBe(true);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'e1' });
  });
});
