'use client';
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from '@/features/planning/providers/PlannerStateProvider';
import { usePlannerHydration } from '@/features/planning/hooks/usePlannerHydration';
import useGoalsApi from './useGoalsApi';
import { Goal } from '../types';
import { computeFooStepCompletion } from '../lib/fooCompletion';

export const GOALS_QUERY_KEY = ['goals'];

/**
 * Loads goals, bootstraps the Financial Order of Operations steps on first
 * visit, and auto-checks FOO steps whose completion criteria the planner data
 * now satisfies. Goal progress reads live account balances from the planner
 * state, so hydration happens here.
 */
export function useGoals() {
  const { userId, isLoaded } = useCurrentUser();
  const { plannerAccounts, plannerSummary } = usePlannerState();
  const queryClient = useQueryClient();
  const api = useGoalsApi();

  usePlannerHydration();

  const {
    data: goals,
    isLoading,
    isError,
  } = useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: () => api.getGoals(),
    enabled: isLoaded && !!userId,
  });

  const { mutate: createFinancialOrderSteps, isPending: isCreatingSteps } = useMutation({
    mutationFn: () => api.createFinancialOrderSteps(),
    onSuccess: (created) => {
      queryClient.setQueryData<Goal[]>(GOALS_QUERY_KEY, (existing) => {
        const others = (existing ?? []).filter((g) => !g.isFinancialOrderStep);
        return [...others, ...created];
      });
    },
  });

  const footSteps = useMemo(
    () =>
      (goals ?? [])
        .filter((g) => g.isFinancialOrderStep)
        .sort((a, b) => (a.financialOrderStep ?? 0) - (b.financialOrderStep ?? 0)),
    [goals],
  );

  const regularGoals = (goals ?? []).filter((g) => !g.isFinancialOrderStep);

  // Create FOO steps on first visit if none exist.
  useEffect(() => {
    if (isLoaded && userId && !isLoading && goals !== undefined && footSteps.length === 0) {
      createFinancialOrderSteps();
    }
  }, [isLoaded, userId, isLoading, goals, footSteps, createFinancialOrderSteps]);

  // Auto-check FOO steps based on planner data
  const completionStatus = useMemo(
    () => computeFooStepCompletion(plannerAccounts, plannerSummary),
    [plannerAccounts, plannerSummary],
  );

  const { mutate: autoCheckFooSteps } = useMutation({
    mutationFn: async (stepsToCheck: Goal[]) => {
      for (const step of stepsToCheck) {
        await api.updateGoal({
          id: step.id,
          description: step.description,
          priority: step.priority,
          isCompleted: true,
          connectedAccountIds: step.connectedAccountIds ?? [],
          isFinancialOrderStep: true,
        });
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
  });

  useEffect(() => {
    if (isLoading || footSteps.length === 0) return;

    const stepsToCheck = footSteps.filter((step) => {
      const stepNum = step.financialOrderStep;
      if (stepNum == null) return false;
      const shouldBeComplete = completionStatus.get(stepNum) ?? false;
      return shouldBeComplete && !step.isCompleted;
    });

    if (stepsToCheck.length > 0) {
      autoCheckFooSteps(stepsToCheck);
    }
  }, [isLoading, footSteps, completionStatus, autoCheckFooSteps]);

  return {
    footSteps,
    regularGoals,
    isLoading: isLoading || isCreatingSteps,
    isError,
  };
}
