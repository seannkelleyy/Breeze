'use client';
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';

import type { UseMutationResult } from '@tanstack/react-query';
import * as plannerConfig from '../../lib/config';
import * as plannerConstants from '../../lib/constants';
import {
  clamp,
  getDefaultAssetFinanceDetailsForAccount,
  normalizeBonusMode,
} from '../../lib/plannerMath';
import type { AccountType, ContributionMode, PlannerAccount } from '../../types/account';
import type {
  AssetFinanceDetails,
  HomeGrowthProfile,
  VehicleDepreciationProfile,
} from '../../types/finance';
import type { PersonType, PlannerPerson } from '../../types/person';
import type { PlannerResponse, PlannerUpsertRequest } from '../../types/planner';

const { accountTypeOptions, contributionModeOptions, isCombinedAssetType } = plannerConfig;

// ─── Pure hydration helpers ───────────────────────────────

function mapPeopleFromResponse(apiPeople: PlannerResponse['people']): PlannerPerson[] {
  return apiPeople.map((person) => {
    const personType: PersonType = person.personType === 'spouse' ? 'spouse' : 'self';
    return {
      id: crypto.randomUUID(),
      type: personType,
      name: person.name,
      birthday: person.birthday?.slice(0, 10) ?? '',
      retirementAge: clamp(person.retirementAge),
      annualSalary: clamp(person.annualSalary),
      bonusMode: normalizeBonusMode(person.bonusMode),
      annualBonus: clamp(person.annualBonus ?? plannerConstants.PLANNER_DEFAULT_ANNUAL_BONUS),
      incomeGrowthRate:
        person.incomeGrowthRate ?? plannerConstants.PLANNER_DEFAULT_INCOME_GROWTH_RATE,
    };
  });
}

function mapAccountsFromResponse(apiAccounts: PlannerResponse['accounts']): PlannerAccount[] {
  return apiAccounts.map((account, index) => ({
    id: `${account.owner}-${account.accountType}-${account.name}-${index}`,
    name: account.name,
    owner: (account.owner === 'spouse' ? 'spouse' : 'self') as PlannerAccount['owner'],
    accountType: (accountTypeOptions.find((o) => o.value === (account.accountType as AccountType))
      ?.value ?? 'other') as AccountType,
    contributionMode: (contributionModeOptions.find(
      (o) => o.value === (account.contributionMode as ContributionMode),
    )?.value ?? 'monthly') as ContributionMode,
    contributionValue: clamp(account.contributionValue),
    employerMatchRate: clamp(account.employerMatchRate),
    employerMatchMaxPercentOfSalary: clamp(account.employerMatchMaxPercentOfSalary),
    startingBalance: clamp(account.startingBalance),
    annualRate: account.annualRate,
  }));
}

function mapAssetFinanceDetailsFromResponse(
  apiAccounts: PlannerResponse['accounts'],
  mappedAccounts: PlannerAccount[],
  existing: Record<string, AssetFinanceDetails>,
): Record<string, AssetFinanceDetails> {
  const next = { ...existing };
  for (let i = 0; i < mappedAccounts.length; i += 1) {
    const mapped = mappedAccounts[i];
    const api = apiAccounts[i];
    if (!isCombinedAssetType(mapped.accountType)) continue;
    const fallback = getDefaultAssetFinanceDetailsForAccount(mapped);
    next[mapped.id] = {
      purchaseDate: api.purchaseDate?.slice(0, 10) ?? fallback.purchaseDate,
      purchasePrice: clamp(api.purchasePrice ?? fallback.purchasePrice),
      currentValue: clamp(api.currentValue ?? mapped.startingBalance),
      annualChangeRate: api.annualChangeRate ?? mapped.annualRate,
      homeGrowthProfile:
        (api.homeGrowthProfile as HomeGrowthProfile | undefined) ?? fallback.homeGrowthProfile,
      vehicleDepreciationProfile:
        (api.vehicleDepreciationProfile as VehicleDepreciationProfile | undefined) ??
        fallback.vehicleDepreciationProfile,
      hasLoan: api.hasLoan ?? fallback.hasLoan,
      loanInterestRate: api.loanInterestRate ?? fallback.loanInterestRate,
      originalLoanAmount: clamp(api.originalLoanAmount ?? fallback.originalLoanAmount),
      loanMonthlyPayment: clamp(api.loanMonthlyPayment ?? fallback.loanMonthlyPayment),
      loanTermYears: api.loanTermYears ?? fallback.loanTermYears,
      loanStartDate: api.loanStartDate?.slice(0, 10) ?? fallback.loanStartDate,
      currentLoanBalance: clamp(api.currentLoanBalance ?? fallback.currentLoanBalance),
    };
  }
  return next;
}

// ─── Hook ─────────────────────────────────────────────────

interface Params {
  isSignedIn: boolean;
  isPlannerLoading: boolean;
  isPlannerError: boolean;
  plannerData?: PlannerResponse;
  putPlannerMutation: UseMutationResult<number, Error, PlannerUpsertRequest, unknown>;
  createPlannerPayload: (
    desired: number,
    expenses: number,
    inflation: number,
    swr: number,
    people: PlannerPerson[],
    accounts: PlannerAccount[],
    afd: Record<string, AssetFinanceDetails>,
  ) => PlannerUpsertRequest;
  state: {
    desiredInvestmentAmount: number;
    monthlyExpenses: number;
    inflationRate: number;
    safeWithdrawalRate: number;
    people: PlannerPerson[];
    accounts: PlannerAccount[];
    assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>;
  };
  setters: {
    setDesiredInvestmentAmount: Dispatch<SetStateAction<number>>;
    setMonthlyExpenses: Dispatch<SetStateAction<number>>;
    setInflationRate: (v: number) => void;
    setSafeWithdrawalRate: (v: number) => void;
    setPeople: Dispatch<SetStateAction<PlannerPerson[]>>;
    setAccounts: Dispatch<SetStateAction<PlannerAccount[]>>;
    setAssetFinanceDetailsByAccountId: Dispatch<
      SetStateAction<Record<string, AssetFinanceDetails>>
    >;
  };
}

function usePlannerPersistence({
  isSignedIn,
  isPlannerLoading,
  isPlannerError,
  plannerData,
  putPlannerMutation,
  createPlannerPayload,
  state,
  setters,
}: Params) {
  const hasHydrated = useRef(false);
  const lastSavedPayload = useRef('');
  const [hasSaveError, setHasSaveError] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Hydrate from planner API response on mount
  useEffect(() => {
    if (!isSignedIn || hasHydrated.current || isPlannerLoading || isPlannerError) return;

    if (plannerData && plannerData.monthlyExpenses > 0) {
      setters.setMonthlyExpenses(clamp(plannerData.monthlyExpenses));
    }

    const hasExistingData = Boolean(
      plannerData &&
      (plannerData.id > 0 ||
        (plannerData.people ?? []).length > 0 ||
        (plannerData.accounts ?? []).length > 0),
    );

    if (hasExistingData && plannerData) {
      const desired =
        plannerData.desiredInvestmentAmount > 0
          ? clamp(plannerData.desiredInvestmentAmount)
          : plannerConstants.PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT;
      const expenses =
        plannerData.monthlyExpenses > 0
          ? clamp(plannerData.monthlyExpenses)
          : plannerConstants.PLANNER_DEFAULT_MONTHLY_EXPENSES;

      const mappedPeople = mapPeopleFromResponse(plannerData.people);
      const mappedAccounts = mapAccountsFromResponse(plannerData.accounts);

      setters.setDesiredInvestmentAmount(desired);
      setters.setMonthlyExpenses(expenses);
      if (mappedPeople.length > 0) setters.setPeople(mappedPeople);
      if (mappedAccounts.length > 0) {
        setters.setAccounts(mappedAccounts);
        setters.setAssetFinanceDetailsByAccountId((prev) =>
          mapAssetFinanceDetailsFromResponse(plannerData.accounts, mappedAccounts, prev),
        );
      }

      lastSavedPayload.current = JSON.stringify(
        createPlannerPayload(
          desired,
          expenses,
          state.inflationRate,
          state.safeWithdrawalRate,
          mappedPeople.length > 0 ? mappedPeople : state.people,
          mappedAccounts.length > 0 ? mappedAccounts : state.accounts,
          state.assetFinanceDetailsByAccountId,
        ),
      );
    } else {
      lastSavedPayload.current = JSON.stringify(
        createPlannerPayload(
          state.desiredInvestmentAmount,
          plannerData?.monthlyExpenses ? clamp(plannerData.monthlyExpenses) : state.monthlyExpenses,
          state.inflationRate,
          state.safeWithdrawalRate,
          state.people,
          state.accounts,
          state.assetFinanceDetailsByAccountId,
        ),
      );
    }

    hasHydrated.current = true;
  }, [
    isSignedIn,
    isPlannerLoading,
    isPlannerError,
    plannerData,
    createPlannerPayload,
    state,
    setters,
  ]);

  // Autosave on state change
  useEffect(() => {
    if (!isSignedIn || !hasHydrated.current || putPlannerMutation.isPending) return;

    const payload = createPlannerPayload(
      state.desiredInvestmentAmount,
      state.monthlyExpenses,
      state.inflationRate,
      state.safeWithdrawalRate,
      state.people,
      state.accounts,
      state.assetFinanceDetailsByAccountId,
    );
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedPayload.current) return;

    const timer = window.setTimeout(() => {
      putPlannerMutation.mutate(payload, {
        onSuccess: () => {
          lastSavedPayload.current = serialized;
          setHasSaveError(false);
          setLastSavedAt(new Date());
        },
        onError: () => setHasSaveError(true),
      });
    }, plannerConstants.PLANNER_AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [isSignedIn, state, createPlannerPayload, putPlannerMutation]);

  return { hasPlannerSaveError: hasSaveError, lastPlannerSavedAt: lastSavedAt };
}

export default usePlannerPersistence;
