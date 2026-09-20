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
  const [projectionEndAge, setProjectionEndAge] = useState<number | undefined>(undefined);
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
    monthlyExpenses,
    plannerDesiredInvestmentAmount,
    plannerRetirementMethod,
    useInflationAdjustedValues,
  );
  const financialMathSnapshot = useFinancialMathSnapshot(
    monthlyExpenses,
    household,
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
    household,
    plannerAssetFinanceDetailsByAccountId,
    irsLimits,
    inflationRate,
    useInflationAdjustedValues,
    projectionEndAge,
    annualWithdrawal,
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
    targetAge: household.targetAge,
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
    annualHouseholdIncome: household.annualHouseholdIncome,
    monthlyExpenses,
    totalPlannedMonthlyInvestment: portfolio.totalPlannedMonthlyInvestment,
    totalAssets: portfolio.totalAssets,
    totalLiabilities: portfolio.totalLiabilities,
    emergencyFundBalance: portfolio.emergencyFundBalance,
    currentSavingsRate: portfolio.currentSavingsRateTotal,
    projectionEndAge: projectionEndAge ?? household.targetAge,
    setProjectionEndAge,
  };
};

export default usePlannerModel;
