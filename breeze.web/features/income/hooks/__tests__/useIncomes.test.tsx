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

import useIncomes from '../useIncomes';
import type { Income, IncomeInput } from '../../types';

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

describe('useIncomes', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('fetches incomes for a budget', async () => {
    requestMock.mockResolvedValue({ incomes: [income()] });

    const { result } = renderHook(() => useIncomes());
    const incomes = await result.current.getIncomes('b1');

    expect(incomes).toHaveLength(1);
    expect(print(requestMock.mock.calls[0][0])).toContain('incomes');
    expect(requestMock.mock.calls[0][1]).toEqual({ budgetId: 'b1' });
  });

  it('defaults to an empty list when the budget has no incomes', async () => {
    requestMock.mockResolvedValue({});

    const { result } = renderHook(() => useIncomes());

    await expect(result.current.getIncomes('b1')).resolves.toEqual([]);
  });

  it('creates a manual income without a client-supplied user id and returns its id', async () => {
    requestMock.mockResolvedValue({ createIncome: income({ id: 'i2' }) });

    const { result } = renderHook(() => useIncomes());
    const id = await result.current.postIncome('b1', input);

    expect(id).toBe('i2');
    expect(print(requestMock.mock.calls[0][0])).toContain('createIncome');
    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        budgetId: 'b1',
        name: 'Bonus',
        amount: '1200.00',
        date: '2026-03-20',
        sourceType: 'MANUAL',
      },
    });
  });

  it('updates an income preserving its source type', async () => {
    requestMock.mockResolvedValue({
      updateIncome: income({ id: 'i1', name: 'Salary (raised)', amount: '5600.00' }),
    });

    const { result } = renderHook(() => useIncomes());
    const id = await result.current.patchIncome(
      income({ name: 'Salary (raised)', amount: '5600.00', sourceType: 'RECURRING_TEMPLATE' }),
    );

    expect(id).toBe('i1');
    expect(print(requestMock.mock.calls[0][0])).toContain('updateIncome');
    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        id: 'i1',
        name: 'Salary (raised)',
        amount: '5600.00',
        date: '2026-03-15',
        sourceType: 'RECURRING_TEMPLATE',
      },
    });
  });

  it('deletes an income and reports success', async () => {
    requestMock.mockResolvedValue({ deleteIncome: true });

    const { result } = renderHook(() => useIncomes());

    await expect(result.current.deleteIncome('i1')).resolves.toBe(true);
    expect(print(requestMock.mock.calls[0][0])).toContain('deleteIncome');
    expect(requestMock.mock.calls[0][1]).toEqual({ id: 'i1' });
  });
});
