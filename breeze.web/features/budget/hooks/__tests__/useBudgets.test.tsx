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

import useBudgets from '../useBudgets';

const budget = {
  id: 'b1',
  userId: 'u1',
  monthlyIncome: '5000.00',
  monthlyExpenses: '3500.00',
  date: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

describe('useBudgets', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('fetches the budget for a month using the user and first-of-month ISO date', async () => {
    requestMock.mockResolvedValue({ budgetByDate: budget });

    const { result } = renderHook(() => useBudgets());

    const fetched = await result.current.getBudget(2026, 3);

    expect(fetched).toEqual(budget);
    expect(print(requestMock.mock.calls[0][0])).toContain('budgetByDate');
    expect(requestMock.mock.calls[0][1]).toEqual({
      userId: 'u1',
      date: new Date(2026, 2, 1).toISOString(),
    });
  });

  it('returns null when the month has no budget yet', async () => {
    requestMock.mockResolvedValue({ budgetByDate: null });

    const { result } = renderHook(() => useBudgets());

    await expect(result.current.getBudget(2026, 4)).resolves.toBeNull();
  });

  it('returns null when the response omits the budget field', async () => {
    requestMock.mockResolvedValue({});

    const { result } = renderHook(() => useBudgets());

    await expect(result.current.getBudget(2026, 5)).resolves.toBeNull();
  });
});
