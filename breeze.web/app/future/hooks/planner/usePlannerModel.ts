'use client';
import { useEffect, useMemo, useState } from 'react';

import type { ChartConfig } from '@/components/ui/chart';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import * as plannerConfig from '../../lib/config';
import type { AssetFinanceDetails } from '../../types/finance';
import type { ProjectionRow } from '../../types/projection';
import type { TaxYearTables } from '../../types/tax';
import { usePlannerState } from '../../providers/PlannerStateProvider';
import useIrsLimits from './useIrsLimits';
import useTaxYear from './useTaxYear';
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
  const {
    returnDisplayMode,
    inflationRate,
    safeWithdrawalRate,
    filingStatus,
    deductionType,
  } = useCurrentUser();
  const {
    plannerDesiredInvestmentAmount,
    plannerMonthlyExpenses,
    plannerRetirementMethod,
    plannerPeople,
    plannerAccounts,
    plannerAssetFinanceDetailsByAccountId,
    setPlannerSummary,
  } = usePlannerState();
  const { irsLimits } = useIrsLimits();
  const taxTables = useTaxYear(filingStatus);

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
    taxTables,
    deductionType,
  );
  const annualWithdrawal = plannerMonthlyExpenses * 12;
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
  const fireAchievementAges = useFireAchievementAges(
    projectionRows,
    targets.fireTargets,
    household.currentAge,
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
    targetAge: household.targetAge,
    financialMathSnapshot,
    projectionRows,
    accountBreakdownRows,
    dynamicChartConfig,
    fireTargets: targets.fireTargets,
    fireAchievementAges,
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
    monthlyExpenses: plannerMonthlyExpenses,
    totalPlannedMonthlyInvestment: portfolio.totalPlannedMonthlyInvestment,
    totalAssets: portfolio.totalAssets,
    totalLiabilities: portfolio.totalLiabilities,
    currentSavingsRate: portfolio.currentSavingsRateTotal,
    projectionEndAge: projectionEndAge ?? household.targetAge,
    setProjectionEndAge,
  };
};

export default usePlannerModel;
