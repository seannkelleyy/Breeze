'use client';
import { useEffect, useMemo } from 'react';

import type { ChartConfig } from '@/components/ui/chart';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import * as plannerConfig from '../../lib/config';
import * as plannerConstants from '../../lib/constants';
import {
  accountLineColors,
  clamp,
  getAgeFromBirthday,
  getAnnualIncomeWithGrowth,
  getAssetFinanceSnapshot,
  getEffectiveAnnualRatePercent,
  getEmployeeMonthlyContribution,
  getEmployerMatchMonthly,
  getFinancialMathSnapshot,
  getMonthlyContribution,
  getRealAnnualRatePercent,
  getNetWorthStartingBalance,
  getPlannerContributionTotals,
  getPlannerHouseholdSnapshot,
  getProjection,
  getSuggestedAnnualLimit,
  getSuggestedSafeWithdrawalRate,
  getTotalMonthlyForAccount,
  plannerChartConfig,
} from '../../lib/plannerMath';
import type { AssetFinanceDetails } from '../../types/finance';
import type { IrsLimitConfig } from '../../types/irs';
import type { ProjectionRow } from '../../types/projection';
import useIrsLimits from './useIrsLimits';

const { accountTypeOptions, isCombinedAssetType, isLiabilityAccountType } = plannerConfig;

// ─── Household ────────────────────────────────────────────
function useHouseholdCalculation(people: ReturnType<typeof useCurrentUser>['plannerPeople']) {
  return useMemo(() => {
    const { householdIncome, currentAge } = getPlannerHouseholdSnapshot(people);
    const targetAge =
      people.length > 0 ? Math.max(...people.map((p) => p.retirementAge)) : currentAge;
    const yearsToGoal = Math.max(0, targetAge - currentAge);

    return {
      people,
      currentAge,
      targetAge,
      yearsToGoal,
      annualHouseholdIncome: householdIncome,
    };
  }, [people]);
}

// ─── Portfolio & Rates ────────────────────────────────────
function usePortfolioCalculation(
  accounts: ReturnType<typeof useCurrentUser>['plannerAccounts'],
  assetFinanceDetailsByAccountId: ReturnType<
    typeof useCurrentUser
  >['plannerAssetFinanceDetailsByAccountId'],
  household: ReturnType<typeof useHouseholdCalculation>,
  inflationRate: number,
  useInflationAdjustedValues: boolean,
) {
  const totalStartingBalance = useMemo(
    () =>
      accounts.reduce((sum, account) => {
        if (isCombinedAssetType(account.accountType)) {
          const details = assetFinanceDetailsByAccountId[account.id];
          if (details) return sum + getAssetFinanceSnapshot(details, new Date()).equity;
        }
        return sum + getNetWorthStartingBalance(account);
      }, 0),
    [accounts, assetFinanceDetailsByAccountId],
  );

  const totalAssets = useMemo(
    () =>
      accounts
        .filter((a) => !isLiabilityAccountType(a.accountType))
        .reduce((sum, a) => {
          if (isCombinedAssetType(a.accountType))
            return (
              sum + clamp(assetFinanceDetailsByAccountId[a.id]?.currentValue ?? a.startingBalance)
            );
          return sum + clamp(a.startingBalance);
        }, 0),
    [accounts, assetFinanceDetailsByAccountId],
  );

  const totalLiabilities = useMemo(
    () =>
      accounts.reduce((sum, a) => {
        if (isLiabilityAccountType(a.accountType)) return sum + clamp(a.startingBalance);
        if (isCombinedAssetType(a.accountType)) {
          const d = assetFinanceDetailsByAccountId[a.id];
          if (d?.hasLoan) return sum + clamp(d.currentLoanBalance);
        }
        return sum;
      }, 0),
    [accounts, assetFinanceDetailsByAccountId],
  );

  const { totalPlannedMonthlyEmployee, totalPlannedMonthlyInvestment } = useMemo(
    () => getPlannerContributionTotals(accounts, household.people),
    [accounts, household.people],
  );

  const weightedAnnualRate = useMemo(() => {
    const totalWeight = accounts.reduce(
      (s, a) => s + getTotalMonthlyForAccount(a, household.people),
      0,
    );
    if (totalWeight === 0)
      return accounts.length > 0
        ? accounts.reduce((s, a) => s + a.annualRate, 0) / accounts.length
        : 0;
    return accounts.reduce(
      (s, a) => s + (getTotalMonthlyForAccount(a, household.people) / totalWeight) * a.annualRate,
      0,
    );
  }, [accounts, household.people]);

  const effectiveWeightedAnnualRate = useMemo(
    () =>
      getEffectiveAnnualRatePercent(weightedAnnualRate, inflationRate, useInflationAdjustedValues),
    [weightedAnnualRate, inflationRate, useInflationAdjustedValues],
  );

  const emergencyFundBalance = useMemo(
    () =>
      accounts
        .filter((a) => a.accountType === 'emergency-fund' || a.accountType === 'checking')
        .reduce((sum, a) => sum + getNetWorthStartingBalance(a), 0),
    [accounts],
  );

  const currentSavingsRateEmployee =
    household.annualHouseholdIncome > 0
      ? (totalPlannedMonthlyEmployee * 12 * 100) / household.annualHouseholdIncome
      : 0;
  const currentSavingsRateTotal =
    household.annualHouseholdIncome > 0
      ? (totalPlannedMonthlyInvestment * 12 * 100) / household.annualHouseholdIncome
      : 0;

  const realWeightedAnnualRate = useMemo(
    () => getRealAnnualRatePercent(weightedAnnualRate, inflationRate),
    [weightedAnnualRate, inflationRate],
  );

  return {
    totalStartingBalance,
    totalAssets,
    totalLiabilities,
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyInvestment,
    weightedAnnualRate,
    effectiveWeightedAnnualRate,
    realWeightedAnnualRate,
    currentSavingsRateEmployee,
    currentSavingsRateTotal,
    emergencyFundBalance,
  };
}

// ─── FIRE & Retirement Targets ────────────────────────────
function useRetirementTargets(
  household: ReturnType<typeof useHouseholdCalculation>,
  portfolio: ReturnType<typeof usePortfolioCalculation>,
  inflationRate: number,
  safeWithdrawalRate: number,
  monthlyExpenses: number,
  desiredInvestmentAmount: number,
  retirementMethod: string,
  useInflationAdjustedValues: boolean,
) {
  const inflationFactor = (1 + inflationRate / 100) ** household.yearsToGoal;
  const annualNeedToday = monthlyExpenses * 12;

  // ── Display values (change with real/nominal toggle) ────
  const annualNeedAtRetirement = useInflationAdjustedValues
    ? annualNeedToday
    : annualNeedToday * inflationFactor;
  const baseFinancialFreedomTarget =
    safeWithdrawalRate > 0 ? annualNeedAtRetirement / (safeWithdrawalRate / 100) : 0;
  const retirementHorizonYears = Math.max(
    1,
    plannerConstants.PLANNER_DEFAULT_LONGEVITY_AGE - household.targetAge,
  );
  const suggestedSafeWithdrawalRate = getSuggestedSafeWithdrawalRate(retirementHorizonYears);

  const fireTargets = useMemo(
    () =>
      plannerConstants.PLANNER_FIRE_LIFESTYLE_OPTIONS.map((o) => ({
        label: o.label,
        target: baseFinancialFreedomTarget * o.multiplier,
        monthlySpendSupported:
          safeWithdrawalRate > 0
            ? (baseFinancialFreedomTarget * o.multiplier * (safeWithdrawalRate / 100)) / 12
            : 0,
      })),
    [baseFinancialFreedomTarget, safeWithdrawalRate],
  );

  const financialFreedomTarget =
    fireTargets[plannerConstants.PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX]?.target ??
    baseFinancialFreedomTarget;

  // Income replacement (display)
  const getRealGrowthRate = (nominal: number) => {
    const d = inflationRate / 100;
    if (d <= -1) return nominal;
    return ((1 + nominal / 100) / (1 + d) - 1) * 100;
  };
  const projectedHouseholdIncomeAtRetirement = household.people.reduce((sum, p) => {
    const growth = useInflationAdjustedValues
      ? getRealGrowthRate(p.incomeGrowthRate)
      : p.incomeGrowthRate;
    return sum + getAnnualIncomeWithGrowth(p.annualSalary, growth, household.yearsToGoal);
  }, 0);
  const incomeReplacementAnnualNeedToday =
    household.annualHouseholdIncome *
    (plannerConstants.PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE / 100);
  const incomeReplacementAnnualNeed = useInflationAdjustedValues
    ? incomeReplacementAnnualNeedToday
    : incomeReplacementAnnualNeedToday * inflationFactor;
  const incomeReplacementTarget =
    safeWithdrawalRate > 0 ? incomeReplacementAnnualNeed / (safeWithdrawalRate / 100) : 0;

  const selectedRetirementTarget =
    retirementMethod === 'target-amount'
      ? desiredInvestmentAmount
      : retirementMethod === 'income-replacement'
        ? incomeReplacementTarget
        : financialFreedomTarget;
  const selectedRetirementMethodLabel =
    plannerConstants.PLANNER_RETIREMENT_METHOD_OPTIONS.find((o) => o.value === retirementMethod)
      ?.label ?? 'Selected Method';

  // ── Real (today's-dollar) values — never change with toggle ──
  const realAnnualNeedAtRetirement = annualNeedToday;
  const realBaseFinancialFreedomTarget =
    safeWithdrawalRate > 0 ? realAnnualNeedAtRetirement / (safeWithdrawalRate / 100) : 0;
  const realFinancialFreedomTarget =
    fireTargets[plannerConstants.PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX]?.target !== undefined
      ? realBaseFinancialFreedomTarget *
        plannerConstants.PLANNER_FIRE_LIFESTYLE_OPTIONS[
          plannerConstants.PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX
        ].multiplier
      : realBaseFinancialFreedomTarget;
  const realSelectedRetirementTarget =
    retirementMethod === 'target-amount'
      ? desiredInvestmentAmount
      : retirementMethod === 'income-replacement'
        ? incomeReplacementAnnualNeedToday / (safeWithdrawalRate / 100)
        : realFinancialFreedomTarget;

  const monthlyNeededForDesiredTarget = getMonthlyContribution(
    realSelectedRetirementTarget,
    portfolio.totalStartingBalance,
    portfolio.realWeightedAnnualRate,
    household.yearsToGoal,
  );
  const monthlyNeededForFreedomTarget = getMonthlyContribution(
    realFinancialFreedomTarget,
    portfolio.totalStartingBalance,
    portfolio.realWeightedAnnualRate,
    household.yearsToGoal,
  );
  const requiredSavingsRate =
    household.annualHouseholdIncome > 0
      ? (monthlyNeededForDesiredTarget * 12 * 100) / household.annualHouseholdIncome
      : 0;
  const savingsRateGap = portfolio.currentSavingsRateTotal - requiredSavingsRate;
  const monthlyGap = portfolio.totalPlannedMonthlyInvestment - monthlyNeededForDesiredTarget;
  const isMonthlyGapPositive = plannerConstants.isMoneyGreaterThanOrEqualWithTolerance(
    monthlyGap,
    0,
  );

  const realAnnualReturnFactor = 1 + portfolio.realWeightedAnnualRate / 100;
  const coastFireTargetToday =
    realAnnualReturnFactor > 0
      ? realFinancialFreedomTarget / realAnnualReturnFactor ** household.yearsToGoal
      : realFinancialFreedomTarget;
  const coastFireGap = portfolio.totalStartingBalance - coastFireTargetToday;
  const hasReachedCoastFire = plannerConstants.isMoneyGreaterThanOrEqualWithTolerance(
    coastFireGap,
    0,
  );

  return {
    fireTargets,
    baseFinancialFreedomTarget,
    financialFreedomTarget,
    retirementHorizonYears,
    suggestedSafeWithdrawalRate,
    projectedHouseholdIncomeAtRetirement,
    incomeReplacementAnnualNeed,
    incomeReplacementAnnualNeedToday,
    incomeReplacementTarget,
    selectedRetirementTarget,
    selectedRetirementMethodLabel,
    monthlyNeededForDesiredTarget,
    monthlyNeededForFreedomTarget,
    requiredSavingsRate,
    savingsRateGap,
    monthlyGap,
    isMonthlyGapPositive,
    annualNeedAtRetirement,
    coastFireTargetToday,
    coastFireGap,
    hasReachedCoastFire,
  };
}

// ─── Financial Math Snapshot ──────────────────────────────
function useFinancialMathSnapshot(
  monthlyExpenses: number,
  household: ReturnType<typeof useHouseholdCalculation>,
  safeWithdrawalRate: number,
  portfolio: ReturnType<typeof usePortfolioCalculation>,
  filingStatus: string,
  deductionType: string,
) {
  return useMemo(
    () =>
      getFinancialMathSnapshot({
        monthlyExpenses,
        selfSalary: household.annualHouseholdIncome,
        spouseSalary: 0,
        safeWithdrawalRate,
        currentPortfolio: portfolio.totalStartingBalance,
        emergencyFundBalance: portfolio.emergencyFundBalance,
        filingStatus,
        deductionType,
      }),
    [
      monthlyExpenses,
      household.annualHouseholdIncome,
      safeWithdrawalRate,
      portfolio.totalStartingBalance,
      portfolio.emergencyFundBalance,
      filingStatus,
      deductionType,
    ],
  );
}

// ─── Projections ──────────────────────────────────────────
function useProjections(
  accounts: ReturnType<typeof useCurrentUser>['plannerAccounts'],
  household: ReturnType<typeof useHouseholdCalculation>,
  assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
  irsLimits: IrsLimitConfig,
  inflationRate: number,
  useInflationAdjustedValues: boolean,
) {
  const { projectionRows, finalBalances } = useMemo(
    () =>
      getProjection(
        accounts,
        household.currentAge,
        household.targetAge,
        household.people,
        assetFinanceDetailsByAccountId,
        irsLimits,
        plannerConstants.PLANNER_DEFAULT_IRS_LIMIT_GROWTH_RATE,
        inflationRate,
        useInflationAdjustedValues,
      ),
    [
      accounts,
      household.currentAge,
      household.targetAge,
      household.people,
      assetFinanceDetailsByAccountId,
      irsLimits,
      inflationRate,
      useInflationAdjustedValues,
    ],
  );

  const projectedNetWorthAtTargetAge = projectionRows[projectionRows.length - 1]?.totalBalance ?? 0;

  return { projectionRows, finalBalances, projectedNetWorthAtTargetAge };
}

// ─── Financial Freedom Age ────────────────────────────────
function useFinancialFreedomAge(projectionRows: ProjectionRow[], financialFreedomTarget: number) {
  return useMemo(() => {
    const hit = projectionRows.find((r) => r.totalBalance >= financialFreedomTarget);
    return hit?.age ?? null;
  }, [projectionRows, financialFreedomTarget]);
}

// ─── Account Breakdown ────────────────────────────────────
function useAccountBreakdown(
  accounts: ReturnType<typeof useCurrentUser>['plannerAccounts'],
  household: ReturnType<typeof useHouseholdCalculation>,
  people: ReturnType<typeof useCurrentUser>['plannerPeople'],
  irsLimits: IrsLimitConfig,
  finalBalances: number[],
) {
  return useMemo(
    () =>
      accounts.map((account, index) => {
        const employeeMonthly = getEmployeeMonthlyContribution(account, household.people);
        const annualEmployee = employeeMonthly * 12;
        const ownerPersons = people.filter((p) => account.personIds.includes(p.id));
        const ownerAge =
          ownerPersons.length > 0
            ? Math.max(...ownerPersons.map((p) => getAgeFromBirthday(p.birthday)))
            : household.currentAge;
        const suggestedLimit = getSuggestedAnnualLimit(
          account.accountType,
          ownerAge,
          irsLimits,
          people.length > 1,
        );
        const matchMonthly = getEmployerMatchMonthly(account, household.people);
        const typeLabel =
          accountTypeOptions.find((o) => o.value === account.accountType)?.label ?? 'Other';
        const ownerLabel =
          ownerPersons.length > 0 ? ownerPersons.map((p) => p.name).join(', ') : 'Unassigned';

        return {
          id: account.id,
          name: account.name,
          ownerLabel,
          accountTypeLabel: typeLabel,
          employeeMonthly,
          matchMonthly,
          totalMonthly: employeeMonthly + matchMonthly,
          annualEmployee,
          suggestedLimit,
          exceedsLimit:
            suggestedLimit > 0 &&
            plannerConstants.isMoneyGreaterThanWithTolerance(annualEmployee, suggestedLimit),
          projectedValue: finalBalances[index] ?? 0,
        };
      }),
    [accounts, household.people, household.currentAge, people, irsLimits, finalBalances],
  );
}

// ─── Chart Config ─────────────────────────────────────────
function useChartConfig(accounts: ReturnType<typeof useCurrentUser>['plannerAccounts']) {
  return useMemo(() => {
    const entries = Object.fromEntries(
      accounts.map((a, i) => [
        `account-${i}`,
        { label: a.name, color: accountLineColors[i % accountLineColors.length] },
      ]),
    );
    return { ...plannerChartConfig, ...entries } satisfies ChartConfig;
  }, [accounts]);
}

// ─── Main Hook ────────────────────────────────────────────
const usePlannerModel = () => {
  const {
    returnDisplayMode,
    inflationRate,
    safeWithdrawalRate,
    setPlannerSummary,
    plannerDesiredInvestmentAmount,
    plannerMonthlyExpenses,
    plannerRetirementMethod,
    plannerPeople,
    plannerAccounts,
    plannerAssetFinanceDetailsByAccountId,
    filingStatus,
    deductionType,
  } = useCurrentUser();
  const { irsLimits } = useIrsLimits();

  const useInflationAdjustedValues = returnDisplayMode === 'real';

  const household = useHouseholdCalculation(plannerPeople);

  // Exclude linked liabilities from calculations — their data is already
  // incorporated into the parent asset's equity via getAssetFinanceSnapshot.
  const filteredAccounts = useMemo(() => {
    const linkedIds = new Set(
      plannerAccounts
        .filter((a) => isCombinedAssetType(a.accountType) && a.linkedLiabilityId)
        .map((a) => a.linkedLiabilityId!),
    );
    return plannerAccounts.filter((a) => !linkedIds.has(a.id));
  }, [plannerAccounts]);

  const portfolio = usePortfolioCalculation(
    filteredAccounts,
    plannerAssetFinanceDetailsByAccountId,
    household,
    inflationRate,
    useInflationAdjustedValues,
  );
  const targets = useRetirementTargets(
    household,
    portfolio,
    inflationRate,
    safeWithdrawalRate,
    plannerMonthlyExpenses,
    plannerDesiredInvestmentAmount,
    plannerRetirementMethod,
    useInflationAdjustedValues,
  );
  const financialMathSnapshot = useFinancialMathSnapshot(
    plannerMonthlyExpenses,
    household,
    safeWithdrawalRate,
    portfolio,
    filingStatus,
    deductionType,
  );
  const { projectionRows, finalBalances, projectedNetWorthAtTargetAge } = useProjections(
    filteredAccounts,
    household,
    plannerAssetFinanceDetailsByAccountId,
    irsLimits,
    inflationRate,
    useInflationAdjustedValues,
  );
  const financialFreedomAge = useFinancialFreedomAge(
    projectionRows,
    targets.financialFreedomTarget,
  );
  const accountBreakdownRows = useAccountBreakdown(
    filteredAccounts,
    household,
    plannerPeople,
    irsLimits,
    finalBalances,
  );
  const dynamicChartConfig = useChartConfig(filteredAccounts);

  // Sync summary to context
  useEffect(() => {
    setPlannerSummary({
      monthlyNeededForDesiredTarget: targets.monthlyNeededForDesiredTarget,
      requiredMonthlyTargetLabel: targets.selectedRetirementMethodLabel,
      annualHouseholdIncome: household.annualHouseholdIncome,
      currentSavingsRateEmployeePercent: portfolio.currentSavingsRateEmployee,
      currentSavingsRateTotalPercent: portfolio.currentSavingsRateTotal,
      requiredSavingsRatePercent: targets.requiredSavingsRate,
      savingsRateGapPercent: targets.savingsRateGap,
      weightedAnnualRate: portfolio.effectiveWeightedAnnualRate,
      yearsToGoal: household.yearsToGoal,
      monthlyGapToGoal: targets.monthlyGap,
      isMonthlyGapPositive: targets.isMonthlyGapPositive,
      totalStartingBalance: portfolio.totalStartingBalance,
      totalAssets: portfolio.totalAssets,
      totalLiabilities: portfolio.totalLiabilities,
      targetAge: household.targetAge,
      projectedNetWorthAtTargetAge,
      totalPlannedMonthlyInvestment: portfolio.totalPlannedMonthlyInvestment,
      annualNeedAtRetirement: targets.annualNeedAtRetirement,
      financialFreedomTarget: targets.financialFreedomTarget,
      monthlyNeededForFreedomTarget: targets.monthlyNeededForFreedomTarget,
    });
  }, [
    targets.monthlyNeededForDesiredTarget,
    targets.selectedRetirementMethodLabel,
    household.annualHouseholdIncome,
    portfolio.currentSavingsRateEmployee,
    portfolio.currentSavingsRateTotal,
    targets.requiredSavingsRate,
    targets.savingsRateGap,
    portfolio.effectiveWeightedAnnualRate,
    household.yearsToGoal,
    targets.monthlyGap,
    targets.isMonthlyGapPositive,
    portfolio.totalStartingBalance,
    portfolio.totalAssets,
    portfolio.totalLiabilities,
    household.targetAge,
    projectedNetWorthAtTargetAge,
    portfolio.totalPlannedMonthlyInvestment,
    targets.annualNeedAtRetirement,
    targets.financialFreedomTarget,
    targets.monthlyNeededForFreedomTarget,
    setPlannerSummary,
  ]);

  return {
    accounts: plannerAccounts,
    currentAge: household.currentAge,
    financialMathSnapshot,
    projectionRows,
    accountBreakdownRows,
    dynamicChartConfig,
    fireTargets: targets.fireTargets,
    baseFinancialFreedomTarget: targets.baseFinancialFreedomTarget,
    retirementHorizonYears: targets.retirementHorizonYears,
    suggestedSafeWithdrawalRate: targets.suggestedSafeWithdrawalRate,
    financialFreedomAge,
    coastFireTargetToday: targets.coastFireTargetToday,
    coastFireGap: targets.coastFireGap,
    hasReachedCoastFire: targets.hasReachedCoastFire,
    projectedHouseholdIncomeAtRetirement: targets.projectedHouseholdIncomeAtRetirement,
    incomeReplacementAnnualNeed: targets.incomeReplacementAnnualNeed,
    incomeReplacementTarget: targets.incomeReplacementTarget,
  };
};

export default usePlannerModel;
