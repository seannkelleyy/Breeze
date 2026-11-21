'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGoalsApi from '@/features/goals/hooks/useGoalsApi';
import type { Goal } from '@/features/goals/types';
import { goalQueryKeys } from './goalQueryKeys';

interface GoalMutationCallbacks {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function useGoalMutations(callbacks: GoalMutationCallbacks = {}) {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const api = useGoalsApi();
  const queryKey = goalQueryKeys.byUser(userId);
  const invalidateGoals = () => queryClient.invalidateQueries({ queryKey });

  const createGoal = useMutation({
    mutationFn: (input: Partial<Goal> & { description: string; priority: number }) =>
      api.createGoal(input),
    onSuccess: async () => {
      await invalidateGoals();
      callbacks.onCreateSuccess?.();
    },
  });

  const updateGoal = useMutation({
    mutationFn: (input: Partial<Goal> & { id: string; description: string; priority: number }) =>
      api.updateGoal(input),
    onSuccess: async () => {
      await invalidateGoals();
      callbacks.onUpdateSuccess?.();
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onSuccess: async () => {
      await invalidateGoals();
      callbacks.onDeleteSuccess?.();
    },
  });

  return { createGoal, updateGoal, deleteGoal };
}
