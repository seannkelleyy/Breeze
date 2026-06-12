import { useMemo } from 'react';

import * as plannerConfig from '../../lib/config';
import * as plannerConstants from '../../lib/constants';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import {
  clamp,
  getAccountAnnualRateFromProfile,
  getAccountRateProfileFromAnnualRate,
  getAgeFromBirthday,
  getAssetFinanceSnapshot,
  getDefaultAssetFinanceDetailsForAccount,
  getDisplayedRatePercent,
  getEmployeeMonthlyContribution,
  getEmployerMatchMonthly,
  getHomeAnnualGrowthRate,
  getPlannerContributionTotals,
  getPlannerHouseholdSnapshot,
  getRealAnnualRatePercent,
  getStoredAnnualRateFromInput,
  getSuggestedAnnualLimit,
  toIsoDate,
} from '../../lib/plannerMath';
import type { AccountRateProfile, AccountType, PlannerAccount } from '../../types/account';
import type { AssetFinanceDetails } from '../../types/finance';
import useIrsLimits from './useIrsLimits';

const usePlannerAccounts = () => {
  const {
    plannerSummary,
    plannerAccounts,
    setPlannerAccounts,
    plannerAssetFinanceDetailsByAccountId,
    setPlannerAssetFinanceDetailsByAccountId,
    plannerPeople,
    returnDisplayMode,
    inflationRate,
  } = useCurrentUser();
  const { irsLimits, isIrsAccountsLoading, isIrsAccountsError } = useIrsLimits();

  const useInflationAdjustedValues = returnDisplayMode === 'real';
  const people = plannerPeople;
  const { hasSpouse, selfBirthday, selfAnnualIncome, spouseAnnualIncome } =
    getPlannerHouseholdSnapshot(people);

  // ─── Derived options ──────────────────────────────────────
  const accountRateProfileOptions = useMemo(
    () =>
      plannerConfig.accountRateProfileOptions.map((option) => {
        if (option.value === 'custom') return option;
        const nominalRate = plannerConstants.PLANNER_ACCOUNT_RATE_PROFILE_RATES[option.value];
        const displayRate = useInflationAdjustedValues
          ? getRealAnnualRatePercent(nominalRate, inflationRate)
          : nominalRate;
        const labelPrefix = option.label.split(' (')[0];
        return { ...option, label: `${labelPrefix} (${displayRate.toFixed(1)}%)` };
      }),
    [inflationRate, useInflationAdjustedValues],
  );

  // ─── Rate helpers ─────────────────────────────────────────
  const getDisplayedRateForAccount = (account: PlannerAccount) =>
    getDisplayedRatePercent(account, inflationRate, useInflationAdjustedValues);
  const getStoredAnnualRateForInput = (account: PlannerAccount, value: number) =>
    getStoredAnnualRateFromInput(account, value, inflationRate, useInflationAdjustedValues);
  const getRateProfileFromAnnualRate = (annualRate: number): AccountRateProfile =>
    getAccountRateProfileFromAnnualRate(annualRate, inflationRate, useInflationAdjustedValues);
  const getAnnualRateFromProfile = (profile: AccountRateProfile, currentAnnualRate: number) =>
    getAccountAnnualRateFromProfile(
      profile,
      currentAnnualRate,
      inflationRate,
      useInflationAdjustedValues,
    );
  const getSuggestedAnnualLimitForAccount = (
    accountType: AccountType,
    age: number,
    includeSpouse: boolean,
  ) => getSuggestedAnnualLimit(accountType, age, irsLimits, includeSpouse);

  // ─── Totals ───────────────────────────────────────────────
  const {
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyMatch,
    totalPlannedMonthlyInvestment: computedTotal,
  } = useMemo(
    () => getPlannerContributionTotals(plannerAccounts, selfAnnualIncome, spouseAnnualIncome),
    [plannerAccounts, selfAnnualIncome, spouseAnnualIncome],
  );
  const totalPlannedMonthlyInvestment =
    plannerSummary?.totalPlannedMonthlyInvestment ?? computedTotal;
  const weightedAnnualRate = plannerSummary?.weightedAnnualRate ?? 0;

  // ─── Mutators ─────────────────────────────────────────────
  const updateAccount = (id: string, updater: (account: PlannerAccount) => PlannerAccount) => {
    setPlannerAccounts((prev) => prev.map((a) => (a.id === id ? updater(a) : a)));
  };

  const updateAssetFinanceDetails = (
    accountId: string,
    updater: (d: AssetFinanceDetails) => AssetFinanceDetails,
  ) => {
    setPlannerAssetFinanceDetailsByAccountId((prev) => {
      const fallbackAccount = plannerAccounts.find((a) => a.id === accountId);
      const fallback = fallbackAccount
        ? getDefaultAssetFinanceDetailsForAccount(fallbackAccount)
        : getDefaultAssetFinanceDetailsForAccount({
            id: accountId,
            name: 'Asset',
            owner: 'self',
            accountType: 'home',
            contributionMode: 'monthly',
            contributionValue: 0,
            employerMatchRate: 0,
            employerMatchMaxPercentOfSalary: 0,
            startingBalance: 1,
            annualRate: 4,
          });
      const nextDetails = updater(prev[accountId] ?? fallback);
      updateAccount(accountId, (c) => ({
        ...c,
        startingBalance: clamp(nextDetails.currentValue),
        annualRate: nextDetails.annualChangeRate,
      }));
      return { ...prev, [accountId]: nextDetails };
    });
  };

  const removeAccount = (id: string) => {
    if (plannerAccounts.length === 1) return;
    setPlannerAccounts((prev) => prev.filter((a) => a.id !== id));
    setPlannerAssetFinanceDetailsByAccountId((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addAccount = () => {
    setPlannerAccounts((prev) => [
      ...prev,
      {
        id: `local-${crypto.randomUUID()}`,
        name: `Account ${prev.length + 1}`,
        ...plannerConstants.PLANNER_DEFAULT_NEW_ACCOUNT,
        annualRate: weightedAnnualRate,
      },
    ]);
  };

  const addLiability = () => {
    setPlannerAccounts((prev) => [
      ...prev,
      {
        id: `local-${crypto.randomUUID()}`,
        name: `Liability ${plannerAccounts.length + 1}`,
        owner: 'self' as const,
        accountType: 'student-loan' as const,
        contributionMode: 'monthly' as const,
        contributionValue: 500,
        employerMatchRate: 0,
        employerMatchMaxPercentOfSalary: 0,
        startingBalance: 25000,
        annualRate: 6,
      },
    ]);
  };

  return {
    // Data
    data: {
      plannerAccounts,
      assetFinanceDetailsByAccountId: plannerAssetFinanceDetailsByAccountId,
      people,
      hasSpouse,
      selfBirthday,
      selfAnnualIncome,
      spouseAnnualIncome,
      isIrsAccountsLoading,
      isIrsAccountsError,
      totalPlannedMonthlyEmployee,
      totalPlannedMonthlyMatch,
      totalPlannedMonthlyInvestment,
    },
    // Options (read-only config passthroughs)
    options: {
      accountOwnerOptions: plannerConfig.accountOwnerOptions,
      accountRateProfileOptions,
      accountTypeOptions: plannerConfig.accountTypeOptions,
      contributionModeOptions: plannerConfig.contributionModeOptions,
      liabilityContributionModeOptions: plannerConfig.liabilityContributionModeOptions,
      liabilityTypeOptions: plannerConfig.liabilityTypeOptions,
      homeGrowthProfileOptions: plannerConfig.homeGrowthProfileOptions,
      vehicleDepreciationProfileOptions: plannerConfig.vehicleDepreciationProfileOptions,
      defaultHomeGrowthProfile: plannerConstants.PLANNER_DEFAULT_HOME_GROWTH_PROFILE,
      defaultVehicleDepreciationProfile:
        plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_PROFILE,
      defaultHomeAppreciationRate: plannerConstants.PLANNER_DEFAULT_HOME_APPRECIATION_RATE,
      defaultVehicleDepreciationRate: plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE,
    },
    // Type guards
    typeGuards: {
      isLiabilityAccountType: plannerConfig.isLiabilityAccountType,
      isCombinedAssetType: plannerConfig.isCombinedAssetType,
      isNonContributingAccountType: plannerConfig.isNonContributingAccountType,
      isDepreciatingAssetType: plannerConfig.isDepreciatingAssetType,
    },
    // Pure helpers
    helpers: {
      getEmployeeMonthlyContribution,
      getEmployerMatchMonthly,
      getSuggestedAnnualLimitForAccount,
      getDisplayedRateForAccount,
      getStoredAnnualRateForInput,
      getRateProfileFromAnnualRate,
      getAnnualRateFromProfile,
      getAssetFinanceSnapshot,
      getDefaultAssetFinanceDetailsForAccount,
      getHomeAnnualGrowthRate,
      getAgeFromBirthday,
      toIsoDate,
    },
    // Actions
    actions: {
      updateAccount,
      updateAssetFinanceDetails,
      removeAccount,
      addAccount,
      addLiability,
      setPlannerAssetFinanceDetailsByAccountId,
    },
  };
};

export default usePlannerAccounts;
