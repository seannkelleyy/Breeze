'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UPSERT_PLANNER_PERSON, DELETE_PLANNER_PERSON } from '@/lib/services/queries/plannerPeople';
import useGraphql from '@/lib/services/useGraphql';
import { PlannerPerson } from '../../types/person';

export function usePersonMutations(userId: string) {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  const upsertPersonMutation = useMutation({
    mutationFn: async (person: PlannerPerson) => {
      const response = await request<
        { upsertPlannerPerson: { id: string } },
        { input: Record<string, unknown> }
      >(UPSERT_PLANNER_PERSON, {
        input: {
          id: person.id,
          userId: userId,
          personType: person.type,
          name: person.name,
          birthday: person.birthday,
          retirementAge: person.retirementAge,
          annualSalary: person.annualSalary.toString(),
          bonusMode: person.bonusMode,
          annualBonus: person.annualBonus.toString(),
          incomeGrowthRate: person.incomeGrowthRate.toString(),
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerPeople', userId] });
    },
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (personId: string) => {
      await request(DELETE_PLANNER_PERSON, { id: personId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerPeople', userId] });
    },
  });

  return {
    upsertPersonMutation,
    deletePersonMutation,
    isSaving: upsertPersonMutation.isPending,
  };
}

export default usePersonMutations;
