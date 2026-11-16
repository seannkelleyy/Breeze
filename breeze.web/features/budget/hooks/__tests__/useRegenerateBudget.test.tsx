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

import { useRegenerateBudget } from '../useRegenerateBudget';

describe('useRegenerateBudget', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('creates a zeroed budget for the requested month', async () => {
    requestMock.mockResolvedValue({ createBudget: { id: 'b9' } });

    const { result } = renderHook(() => useRegenerateBudget());
    const created = await result.current.regenerateBudgetMonth(2026, 7);

    expect(created).toEqual({ id: 'b9' });
    expect(print(requestMock.mock.calls[0][0])).toContain('createBudget');
    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        userId: 'u1',
        date: new Date(2026, 6, 1).toISOString(),
        monthlyIncome: '0',
        monthlyExpenses: '0',
      },
    });
  });

  it('forwards payroll incomes, stringifying each amount', async () => {
    requestMock.mockResolvedValue({ createBudget: { id: 'b9' } });

    const { result } = renderHook(() => useRegenerateBudget());
    await result.current.regenerateBudgetMonth(2026, 7, [
      {
        personId: 'p1',
        name: 'Alex paycheck',
        amount: 4200.5,
        date: '2026-07-15',
      },
    ]);

    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        userId: 'u1',
        date: new Date(2026, 6, 1).toISOString(),
        monthlyIncome: '0',
        monthlyExpenses: '0',
        payrollIncomes: [
          { personId: 'p1', name: 'Alex paycheck', amount: '4200.5', date: '2026-07-15' },
        ],
      },
    });
  });
});
