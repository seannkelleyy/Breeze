'use client';
import { useEffect, useMemo, useState } from 'react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import * as plannerConfig from '../../lib/config';
import { usePlannerState } from '../../providers/PlannerStateProvider';
import {
  getRecurringExpensesMonthlyTotal,
  useRecurringExpenseTemplates,
} from '@/app/budget/hooks/recurring/recurringTemplateServices';
import useIrsLimits from './useIrsLimits';
import useTaxYear from './useTaxYear';
import usePaycheckDeductions from './usePaycheckDeductions';
import { useHouseholdCalculation } from './model/useHouseholdCalculation';
import { usePortfolioCalculation } from './model/usePortfolioCalculation';
import { useRetirementTargets } from './model/useRetirementTargets';
import { useFinancialMathSnapshot } from './model/useFinancialMathSnapshot';
import { useProjections } from './model/useProjections';
import { useFinancialFreedomAge, useFireAchievementAges } from './model/useFinancialFreedomAges';
import { useAccountBreakdown } from './model/useAccountBreakdown';
import { useChartConfig } from './model/useChartConfig';

const { isCombinedAssetType } = plannerConfig;

// ─── Main Hook ────────────────────────────────────────────
const usePlannerModel = () => {
  // Default to a full-life projection so the post-retirement drawdown phase
  // (contributions stop, inflation-adjusted withdrawals begin) is visible.
  const [projectionEndAge, setProjectionEndAge] = useState<number>(95);
  const { returnDisplayMode, inflationRate, safeWithdrawalRate, filingStatus, deductionType } =
    useCurrentUser();
  const {
    plannerDesiredInvestmentAmount,
    plannerRetirementMethod,
    plannerPeople,
    plannerAccounts,
    plannerAssetFinanceDetailsByAccountId,
    setPlannerSummary,
  } = usePlannerState();
  const { data: recurringExpenseTemplates } = useRecurringExpenseTemplates();
  const { irsLimits } = useIrsLimits();
  const taxTables = useTaxYear(filingStatus);
  const { deductions: allWithholdings } = usePaycheckDeductions(null);

  const useInflationAdjustedValues = returnDisplayMode === 'real';

  // Monthly expenses come from the Expenses tab's recurring expense templates
  const monthlyExpenses = useMemo(
    () => getRecurringExpensesMonthlyTotal(recurringExpenseTemplates ?? []),
    [recurringExpenseTemplates],
  );

  const household = useHouseholdCalculation(plannerPeople);

  // Chart what-if: picking a different retirement age re-runs the whole model
  // (projections, milestones, targets) without changing the saved value on
  // the person — null means "use the person's saved retirement age".
  const [retirementAgeOverride, setRetirementAgeOverride] = useState<number | null>(null);
  // Market stress test: negative shift applied to every asset's projected
  // return (liabilities excluded) — a what-if for bad market sequences.
  const [marketAdjustment, setMarketAdjustment] = useState(0);
  const effectiveHousehold = useMemo(
    () => ({ ...household, targetAge: retirementAgeOverride ?? household.targetAge }),
    [household, retirementAgeOverride],
  );

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
    effectiveHousehold,
    portfolio,
    inflationRate,
    safeWithdrawalRate,
    monthlyExpenses,
    plannerDesiredInvestmentAmount,
    plannerRetirementMethod,
    useInflationAdjustedValues,
  );
  const financialMathSnapshot = useFinancialMathSnapshot(
    monthlyExpenses,
    effectiveHousehold,
    safeWithdrawalRate,
    portfolio,
    taxTables,
    deductionType,
    plannerPeople,
    filteredAccounts,
    allWithholdings,
  );
  const annualWithdrawal = monthlyExpenses * 12;
  const { projectionRows, finalBalances, projectedNetWorthAtTargetAge } = useProjections(
    filteredAccounts,
    effectiveHousehold,
    plannerAssetFinanceDetailsByAccountId,
    irsLimits,
    inflationRate,
    useInflationAdjustedValues,
    projectionEndAge,
    annualWithdrawal,
    marketAdjustment,
  );
  const financialFreedomAge = useFinancialFreedomAge(
    projectionRows,
    targets.financialFreedomTarget,
  );
  // Every goal worth tracking gets a milestone row: the five FIRE lifestyles
  // and income replacement, sorted by target so the table reads as a ladder.
  // Custom is always pinned last, regardless of its amount.
  const milestoneTargets = useMemo(() => {
    const sorted = [
      ...targets.fireTargets.map((ft) => ({ label: ft.label, target: ft.target })),
      { label: 'Income replacement', target: targets.incomeReplacementTarget },
    ]
      .filter((m) => m.target > 0)
      .sort((a, b) => a.target - b.target);
    return plannerDesiredInvestmentAmount > 0
      ? [...sorted, { label: 'Custom', target: plannerDesiredInvestmentAmount }]
      : sorted;
  }, [targets.fireTargets, targets.incomeReplacementTarget, plannerDesiredInvestmentAmount]);
  const milestones = useFireAchievementAges(projectionRows, milestoneTargets, household.currentAge);
  const accountBreakdownRows = useAccountBreakdown(
    filteredAccounts,
    effectiveHousehold,
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
      annualHouseholdIncome: effectiveHousehold.annualHouseholdIncome,
      currentSavingsRateEmployeePercent: portfolio.currentSavingsRateEmployee,
      currentSavingsRateTotalPercent: portfolio.currentSavingsRateTotal,
      requiredSavingsRatePercent: targets.requiredSavingsRate,
      savingsRateGapPercent: targets.savingsRateGap,
      weightedAnnualRate: portfolio.effectiveWeightedAnnualRate,
      yearsToGoal: effectiveHousehold.yearsToGoal,
      monthlyGapToGoal: targets.monthlyGap,
      isMonthlyGapPositive: targets.isMonthlyGapPositive,
      totalStartingBalance: portfolio.totalStartingBalance,
      totalAssets: portfolio.totalAssets,
      totalLiabilities: portfolio.totalLiabilities,
      targetAge: effectiveHousehold.targetAge,
      projectedNetWorthAtTargetAge,
      totalPlannedMonthlyInvestment: portfolio.totalPlannedMonthlyInvestment,
      annualNeedAtRetirement: targets.annualNeedAtRetirement,
      financialFreedomTarget: targets.financialFreedomTarget,
      monthlyNeededForFreedomTarget: targets.monthlyNeededForFreedomTarget,
    });
  }, [
    targets.monthlyNeededForDesiredTarget,
    targets.selectedRetirementMethodLabel,
    effectiveHousehold.annualHouseholdIncome,
    portfolio.currentSavingsRateEmployee,
    portfolio.currentSavingsRateTotal,
    targets.requiredSavingsRate,
    targets.savingsRateGap,
    portfolio.effectiveWeightedAnnualRate,
    effectiveHousehold.yearsToGoal,
    targets.monthlyGap,
    targets.isMonthlyGapPositive,
    portfolio.totalStartingBalance,
    portfolio.totalAssets,
    portfolio.totalLiabilities,
    effectiveHousehold.targetAge,
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
    targetAge: effectiveHousehold.targetAge,
    setRetirementAgeOverride,
    marketAdjustment,
    setMarketAdjustment,
    totalStartingBalance: portfolio.totalStartingBalance,
    projectedNetWorthAtTargetAge,
    financialMathSnapshot,
    projectionRows,
    accountBreakdownRows,
    dynamicChartConfig,
    fireTargets: targets.fireTargets,
    milestones,
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
    investmentStartingBalance: portfolio.investmentStartingBalance,
    realWeightedAnnualRate: portfolio.realWeightedAnnualRate,
    monthlyGapToGoal: targets.monthlyGap,
    isMonthlyGapPositive: targets.isMonthlyGapPositive,
    annualHouseholdIncome: effectiveHousehold.annualHouseholdIncome,
    monthlyExpenses,
    totalPlannedMonthlyInvestment: portfolio.totalPlannedMonthlyInvestment,
    totalAssets: portfolio.totalAssets,
    totalLiabilities: portfolio.totalLiabilities,
    emergencyFundBalance: portfolio.emergencyFundBalance,
    currentSavingsRate: portfolio.currentSavingsRateTotal,
    projectionEndAge: projectionEndAge ?? effectiveHousehold.targetAge,
    setProjectionEndAge,
  };
};

export default usePlannerModel;
