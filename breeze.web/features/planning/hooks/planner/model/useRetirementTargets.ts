import { useMemo } from 'react';

import * as plannerConstants from '../../../lib/constants';
import { getAnnualIncomeWithGrowth, getMonthlyContribution } from '../../../lib/plannerMath';
import { getSuggestedSafeWithdrawalRate } from '../../../lib/rates';
import type { Household, Portfolio } from './types';

export function useRetirementTargets(
  household: Household,
  portfolio: Portfolio,
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
    portfolio.investmentStartingBalance,
    portfolio.realWeightedAnnualRate,
    household.yearsToGoal,
  );
  const monthlyNeededForFreedomTarget = getMonthlyContribution(
    realFinancialFreedomTarget,
    portfolio.investmentStartingBalance,
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
  const coastFireGap = portfolio.investmentStartingBalance - coastFireTargetToday;
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
