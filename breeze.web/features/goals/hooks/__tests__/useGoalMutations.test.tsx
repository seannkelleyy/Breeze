import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api, userState } = vi.hoisted(() => ({
  api: {
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
  },
  userState: { userId: 'user-1' as string | null },
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

vi.mock('../useGoalsApi', () => ({
  default: () => api,
}));

import { useGoalMutations } from '../useGoalMutations';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { wrapper: QueryWrapper, invalidateSpy };
};

describe('useGoalMutations', () => {
  beforeEach(() => {
    api.createGoal.mockReset();
    api.updateGoal.mockReset();
    api.deleteGoal.mockReset();
    userState.userId = 'user-1';
  });

  it('invalidates only the active user’s goals after creating a goal', async () => {
    api.createGoal.mockResolvedValue({ id: 'goal-1' });
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useGoalMutations(), { wrapper });

    await act(async () => {
      await result.current.createGoal.mutateAsync({ description: 'Emergency fund', priority: 1 });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals', 'user-1'] });
  });
});
