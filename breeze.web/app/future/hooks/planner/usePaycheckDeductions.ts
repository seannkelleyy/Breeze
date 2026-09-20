'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import {
  DELETE_PAYCHECK_DEDUCTION,
  GET_PAYCHECK_DEDUCTIONS,
  GET_PAYCHECK_DEDUCTIONS_BY_USER,
  UPSERT_PAYCHECK_DEDUCTION,
} from '@/lib/services/queries/paycheckDeductions';

export interface PaycheckDeduction {
  id: string;
  userId: string;
  personId: string;
  name: string;
  amount: number;
  pretax: boolean;
  kind: string;
  linkedAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaycheckDeductionInput {
  id: string;
  personId: string;
  name: string;
  amount: number;
  pretax: boolean;
  kind: string;
  linkedAccountId: string | null;
}

interface PaycheckDeductionsByUserResponse {
  paycheckDeductionsByUser: Array<{
    id: string;
    userId: string;
    personId: string;
    name: string;
    amount: string;
    pretax: boolean;
    kind: string;
    linkedAccountId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface PaycheckDeductionResponse {
  paycheckDeductions: Array<{
    id: string;
    userId: string;
    personId: string;
    name: string;
    amount: string;
    pretax: boolean;
    kind: string;
    linkedAccountId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface UpsertResponse {
  upsertPaycheckDeduction: {
    id: string;
    userId: string;
    personId: string;
    name: string;
    amount: string;
    pretax: boolean;
    kind: string;
    linkedAccountId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export const usePaycheckDeductions = (personId?: string | null) => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const queryKey = personId
    ? (['paycheckDeductions', personId] as const)
    : (['paycheckDeductions', 'all'] as const);

  const { data, isLoading, isError } = useQuery<PaycheckDeduction[]>({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      if (personId) {
        const response = await request<PaycheckDeductionResponse, { personId: string }>(
          GET_PAYCHECK_DEDUCTIONS,
          { personId },
        );
        return (response.paycheckDeductions ?? []).map((d) => ({
          ...d,
          amount: Number(d.amount) || 0,
        }));
      }
      const response = await request<PaycheckDeductionsByUserResponse, { userId: string }>(
        GET_PAYCHECK_DEDUCTIONS_BY_USER,
        { userId: userId as string },
      );
      return (response.paycheckDeductionsByUser ?? []).map((d) => ({
        ...d,
        amount: Number(d.amount) || 0,
      }));
    },
  });

  const upsertDeduction = useMutation({
    mutationFn: async (input: PaycheckDeductionInput) => {
      const response = await request<UpsertResponse, Record<string, unknown>>(
        UPSERT_PAYCHECK_DEDUCTION,
        {
          input: {
            id: input.id,
            userId: userId as string,
            personId: input.personId,
            name: input.name,
            amount: String(input.amount),
            pretax: input.pretax,
            kind: input.kind,
            linkedAccountId: input.linkedAccountId,
          },
        } as Record<string, unknown>,
      );
      const saved = response.upsertPaycheckDeduction;
      const mapped: PaycheckDeduction = {
        id: saved.id,
        userId: saved.userId,
        personId: saved.personId,
        name: saved.name,
        amount: Number(saved.amount) || 0,
        pretax: saved.pretax,
        kind: saved.kind,
        linkedAccountId: saved.linkedAccountId,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
      queryClient.setQueryData<PaycheckDeduction[]>(queryKey, (prev = []) => {
        const exists = prev.some((d) => d.id === mapped.id);
        return exists ? prev.map((d) => (d.id === mapped.id ? mapped : d)) : [...prev, mapped];
      });
      // Household ('all') and per-person caches must not disagree.
      await queryClient.invalidateQueries({ queryKey: ['paycheckDeductions'] });
      return mapped;
    },
  });

  const deleteDeduction = useMutation({
    mutationFn: async (id: string) => {
      await request<{ deletePaycheckDeduction: boolean }>(DELETE_PAYCHECK_DEDUCTION, { id });
      queryClient.setQueryData<PaycheckDeduction[]>(queryKey, (prev = []) =>
        prev.filter((d) => d.id !== id),
      );
      await queryClient.invalidateQueries({ queryKey: ['paycheckDeductions'] });
    },
  });

  return {
    deductions: data ?? [],
    isLoading,
    isError,
    upsertDeduction,
    deleteDeduction,
  };
};

export default usePaycheckDeductions;
