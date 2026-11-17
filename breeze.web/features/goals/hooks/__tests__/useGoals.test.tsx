import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

import type { PlannerAccount } from '@/features/planning/types/account';

const { requestMock, userState, plannerState } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  userState: { userId: 'u1' as string | null, isLoaded: true },
  plannerState: {
    plannerAccounts: [] as PlannerAccount[],
    plannerSummary: null as import('@/features/planning/types/planner').PlannerSummary | null,
  },
}));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

vi.mock('@/features/planning/providers/PlannerStateProvider', () => ({
  usePlannerState: () => plannerState,
}));

vi.mock('@/features/planning/hooks/usePlannerHydration', () => ({
  usePlannerHydration: () => {},
}));

import { useGoals } from '../useGoals';

type GoalDto = {
  id: string;
  description: string;
  isCompleted: boolean;
  targetAmount: string | null;
  targetDate: string | null;
  category: string | null;
  customCategory: string | null;
  priority: number;
  notes: string | null;
  connectedAccountIds: string[];
  isFinancialOrderStep: boolean;
  financialOrderStep: number | null;
};

const goalDto = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: 'step-3',
  description: 'Pay off high-interest debt',
  isCompleted: false,
  targetAmount: null,
  targetDate: null,
  category: null,
  customCategory: null,
  priority: 1,
  notes: null,
  connectedAccountIds: [],
  isFinancialOrderStep: true,
  financialOrderStep: 3,
  ...overrides,
});

const emptySummary = {
  currentSavingsRateTotalPercent: 0,
} as import('@/features/planning/types/planner').PlannerSummary;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useGoals', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
    userState.isLoaded = true;
    plannerState.plannerAccounts = [];
    plannerState.plannerSummary = emptySummary;
  });

  it('creates the FOO steps on first visit when none exist', async () => {
    const created = [goalDto({ id: 'foo-1', financialOrderStep: 1, description: 'Step one' })];
    requestMock.mockImplementation((document) => {
      const text = print(document);
      if (text.includes('createFinancialOrderSteps')) {
        return Promise.resolve({ createFinancialOrderSteps: created });
      }
      return Promise.resolve({ goals: [] });
    });

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.footSteps).toHaveLength(1));
    expect(result.current.footSteps[0].id).toBe('foo-1');
    expect(
      requestMock.mock.calls.some(([doc]) => print(doc).includes('createFinancialOrderSteps')),
    ).toBe(true);
  });

  it('auto-checks a step when planner data satisfies its criteria', async () => {
    let completed = false;
    requestMock.mockImplementation((document) => {
      const text = print(document);
      if (text.includes('updateGoal')) {
        completed = true;
        return Promise.resolve({
          updateGoal: goalDto({ id: 'step-3', isCompleted: completed }),
        });
      }
      return Promise.resolve({ goals: [goalDto({ isCompleted: completed })] });
    });

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => {
      const updateCall = requestMock.mock.calls.find(([doc]) => print(doc).includes('updateGoal'));
      expect(updateCall).toBeTruthy();
    });

    const updateCall = requestMock.mock.calls.find(([doc]) => print(doc).includes('updateGoal'));
    expect(updateCall?.[1].input).toMatchObject({ id: 'step-3', isCompleted: true });

    await waitFor(() => expect(result.current.footSteps[0].isCompleted).toBe(true));
  });

  it('never tries to re-check a step the user already completed', async () => {
    requestMock.mockResolvedValue({
      goals: [goalDto({ isCompleted: true })],
    });

    renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(requestMock).toHaveBeenCalled());
    // Give the auto-check effect a chance to run, then assert no mutation.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestMock.mock.calls.some(([doc]) => print(doc).includes('updateGoal'))).toBe(false);
  });

  it('does not fetch before the user is loaded', () => {
    userState.isLoaded = false;
    userState.userId = null;

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
    expect(result.current.footSteps).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
