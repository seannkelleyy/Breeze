'use client';
import { useEffect, useRef } from 'react';
import { useFetchPlanner } from '../hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { getDefaultAssetFinanceDetailsForAccount } from '../lib/plannerMath';

export const usePlannerHydration = () => {
  const { data: plannerData } = useFetchPlanner();
  const {
    setPlannerAccounts,
    setPlannerPeople,
    setPlannerAssetFinanceDetailsByAccountId,
    setInflationRate,
    setSafeWithdrawalRate,
    setCurrencyCode,
  } = useCurrentUser();

  const lastHydratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!plannerData) return;

    // Create a fingerprint of the data to avoid re-hydrating the same data
    const fingerprint = JSON.stringify({
      accountCount: plannerData.accounts.length,
      peopleCount: plannerData.people.length,
      inflationRate: plannerData.inflationRate,
      safeWithdrawalRate: plannerData.safeWithdrawalRate,
      currencyCode: plannerData.currencyCode,
    });

    if (lastHydratedRef.current === fingerprint) return;
    lastHydratedRef.current = fingerprint;

    setPlannerAccounts(plannerData.accounts);
    if (plannerData.people.length > 0) {
      setPlannerPeople(plannerData.people);
    }
    setPlannerAssetFinanceDetailsByAccountId((prev) => {
      const next = { ...prev };
      for (const a of plannerData.accounts) {
        if (a.homeGrowthProfile || a.vehicleDepreciationProfile || a.linkedLiabilityId) {
          const details = getDefaultAssetFinanceDetailsForAccount(a);
          if (a.linkedLiabilityId) {
            const liability = plannerData.accounts.find((l) => l.id === a.linkedLiabilityId);
            if (liability) {
              details.hasLoan = true;
              details.currentLoanBalance = liability.startingBalance;
              details.loanInterestRate = liability.annualRate;
              details.loanMonthlyPayment = liability.contributionValue;
              details.originalLoanAmount =
                liability.originalLoanAmount ?? details.originalLoanAmount;
            }
          }
          next[a.id] = details;
        }
      }
      return next;
    });
    setInflationRate(plannerData.inflationRate);
    setSafeWithdrawalRate(plannerData.safeWithdrawalRate);
    setCurrencyCode(plannerData.currencyCode);
  }, [
    plannerData,
    setPlannerAccounts,
    setPlannerPeople,
    setPlannerAssetFinanceDetailsByAccountId,
    setInflationRate,
    setSafeWithdrawalRate,
    setCurrencyCode,
  ]);

  return { plannerData };
};