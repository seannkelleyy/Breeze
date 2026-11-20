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

import useGoalsApi from '../useGoalsApi';

const goal = {
  id: 'g1',
  userId: 'u1',
  description: 'Save for a home',
  isCompleted: false,
  targetAmount: '50000.00',
  targetDate: '2027-01-01',
  category: 'savings',
  customCategory: null,
  priority: 1,
  notes: null,
  connectedAccountIds: [],
  isFinancialOrderStep: false,
  financialOrderStep: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const operationName = (document: unknown) => print(document as never);

describe('useGoalsApi', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('loads goals and tolerates a missing payload', async () => {
    requestMock.mockResolvedValueOnce({ goals: [goal] }).mockResolvedValueOnce({});
    const { result } = renderHook(() => useGoalsApi());

    await expect(result.current.getGoals()).resolves.toEqual([goal]);
    expect(requestMock).toHaveBeenCalledWith(expect.anything());

    await expect(result.current.getGoals()).resolves.toEqual([]);
  });

  it('creates a goal with explicit defaults', async () => {
    requestMock.mockResolvedValue({ createGoal: goal });
    const { result } = renderHook(() => useGoalsApi());

    await expect(
      result.current.createGoal({ description: 'Save for a home', priority: 1 }),
    ).resolves.toEqual(goal);

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        description: 'Save for a home',
        isCompleted: false,
        targetAmount: null,
        targetDate: null,
        category: null,
        customCategory: null,
        priority: 1,
        notes: null,
        connectedAccountIds: [],
        isFinancialOrderStep: false,
        financialOrderStep: null,
      },
    });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('CreateGoal');
  });

  it('updates a goal, preserving supplied fields', async () => {
    requestMock.mockResolvedValue({ updateGoal: goal });
    const { result } = renderHook(() => useGoalsApi());

    await result.current.updateGoal({
      id: 'g1',
      description: 'Save for a home',
      priority: 1,
      isCompleted: true,
      connectedAccountIds: ['a1'],
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: expect.objectContaining({
        id: 'g1',
        isCompleted: true,
        connectedAccountIds: ['a1'],
      }),
    });
  });

  it('deletes a goal', async () => {
    requestMock.mockResolvedValue({ deleteGoal: true });
    const { result } = renderHook(() => useGoalsApi());

    await expect(result.current.deleteGoal('g1')).resolves.toBe(true);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'g1' });
  });

  it('creates FOO steps and tolerates a missing payload', async () => {
    requestMock
      .mockResolvedValueOnce({ createFinancialOrderSteps: [goal] })
      .mockResolvedValueOnce({});
    const { result } = renderHook(() => useGoalsApi());

    await expect(result.current.createFinancialOrderSteps()).resolves.toEqual([goal]);
    await expect(result.current.createFinancialOrderSteps()).resolves.toEqual([]);
  });
});
