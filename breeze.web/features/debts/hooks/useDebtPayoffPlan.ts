'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_LIABILITIES_BY_USER } from '@/features/assets/asset.operations';
import { buildDebtPayoffPlan, type DebtPayoffDebt } from '@/lib/calc/debtPayoff';

/**
 * Loads open liabilities, maps them to payoff debts, and computes the payoff
 * plan under the user's chosen strategy and extra monthly payment.
 */
export function useDebtPayoffPlan(extraPayment: number) {
  const { userId, payoffStrategy } = useCurrentUser();
  const { request } = useGraphql();

  const { data: liabilities, isLoading } = useQuery({
    queryKey: ['debts-payoff', userId],
    queryFn: async () => {
      const resp = await request(GET_LIABILITIES_BY_USER, {
        userId,
      });
      return resp.liabilities ?? [];
    },
    enabled: !!userId,
  });

  const debts: DebtPayoffDebt[] = useMemo(
    () =>
      (liabilities ?? [])
        .map((l) => ({
          id: l.id,
          name: l.name,
          liabilityType: l.liabilityType,
          balance: Number(l.currentBalance),
          annualRatePercent: Number(l.interestRate) * 100,
          minimumPayment: Number(l.minimumPayment),
        }))
        .filter((d) => d.balance > 0),
    [liabilities],
  );

  const plan = useMemo(
    () =>
      buildDebtPayoffPlan({
        debts,
        extraMonthlyPayment: extraPayment,
        strategy: payoffStrategy,
      }),
    [debts, extraPayment, payoffStrategy],
  );

  return { debts, plan, isLoading };
}
