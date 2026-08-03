import { type ReactNode } from 'react';
import { formatCurrencyWithCode } from '../lib/plannerMath';
import RequiredMonthlyContributionCard from './summaryCards/RequiredMonthlyContributionCard';
import NetWorthSnapshotCard from './summaryCards/NetWorthSnapshotCard';
import RetirementNeedEstimateCard from './summaryCards/RetirementNeedEstimateCard';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export type SummaryCardProps = {
  requiredMonthlyCollapsed: boolean;
  requiredMonthlyToggleControl: ReactNode;
  plannedMonthlyCollapsed: boolean;
  plannedMonthlyToggleControl: ReactNode;
  retirementNeedCollapsed: boolean;
  retirementNeedToggleControl: ReactNode;
  currentPortfolio: number;
};

export const SummaryCards = ({
  requiredMonthlyCollapsed,
  requiredMonthlyToggleControl,
  plannedMonthlyCollapsed,
  plannedMonthlyToggleControl,
  retirementNeedCollapsed,
  retirementNeedToggleControl,
  currentPortfolio,
}: SummaryCardProps) => {
  const { plannerSummary, currencyCode } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

  if (!plannerSummary) {
    return null;
  }

  const {
    monthlyNeededForDesiredTarget,
    requiredMonthlyTargetLabel,
    annualHouseholdIncome,
    currentSavingsRateEmployeePercent,
    currentSavingsRateTotalPercent,
    requiredSavingsRatePercent,
    savingsRateGapPercent,
    weightedAnnualRate,
    yearsToGoal,
    monthlyGapToGoal,
    isMonthlyGapPositive,
    totalStartingBalance,
    totalAssets,
    totalLiabilities,
    targetAge,
    projectedNetWorthAtTargetAge,
    totalPlannedMonthlyInvestment,
    annualNeedAtRetirement,
    financialFreedomTarget,
    monthlyNeededForFreedomTarget,
  } = plannerSummary;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <RequiredMonthlyContributionCard
        collapsed={requiredMonthlyCollapsed}
        toggleControl={requiredMonthlyToggleControl}
        monthlyNeededForDesiredTarget={monthlyNeededForDesiredTarget}
        requiredMonthlyTargetLabel={requiredMonthlyTargetLabel}
        annualHouseholdIncome={annualHouseholdIncome}
        weightedAnnualRate={weightedAnnualRate}
        yearsToGoal={yearsToGoal}
        currentSavingsRateEmployeePercent={currentSavingsRateEmployeePercent}
        currentSavingsRateTotalPercent={currentSavingsRateTotalPercent}
        requiredSavingsRatePercent={requiredSavingsRatePercent}
        savingsRateGapPercent={savingsRateGapPercent}
        monthlyGapToGoal={monthlyGapToGoal}
        isMonthlyGapPositive={isMonthlyGapPositive}
        formatCurrency={formatCurrency}
      />
      <NetWorthSnapshotCard
        collapsed={plannedMonthlyCollapsed}
        toggleControl={plannedMonthlyToggleControl}
        totalStartingBalance={totalStartingBalance}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        targetAge={targetAge}
        projectedNetWorthAtTargetAge={projectedNetWorthAtTargetAge}
        totalPlannedMonthlyInvestment={totalPlannedMonthlyInvestment}
        formatCurrency={formatCurrency}
      />
      <RetirementNeedEstimateCard
        collapsed={retirementNeedCollapsed}
        toggleControl={retirementNeedToggleControl}
        annualNeedAtRetirement={annualNeedAtRetirement}
        financialFreedomTarget={financialFreedomTarget}
        monthlyNeededForFreedomTarget={monthlyNeededForFreedomTarget}
        currentPortfolio={currentPortfolio}
        totalPlannedMonthlyInvestment={totalPlannedMonthlyInvestment}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default SummaryCards;
