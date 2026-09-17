'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { usePlannerModel, useFetchPlanner } from './hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from './hooks/usePlannerState';
import { usePlaidConnections, useSyncPlaidConnection } from '@/lib/services/hooks/usePlaid';

import { ProjectionsSection } from './components/sections';
import { FIRETargetsSection } from './components/FIRETargetsSection';
import { accountLineColors, getDefaultAssetFinanceDetailsForAccount } from './lib/plannerMath';
import { PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE } from './lib/constants';

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}

function PlannerContent() {
  const { isLoaded: clerkLoaded } = useUser();
  const { userId, isLoaded } = useCurrentUser();
  const { data: connections } = usePlaidConnections(userId);
  const { mutate: syncConnection } = useSyncPlaidConnection();
  const hasSyncedRef = useRef(false);

  // Auto-sync Plaid connections on page load (once per session)
  useEffect(() => {
    if (!connections || connections.length === 0 || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    for (const conn of connections) {
      syncConnection(conn.id);
    }
  }, [connections, syncConnection]);

  // Manage local UI state
  const { collapsedSections, toggleSection } = usePlannerState();

  // Load planner data from API on mount and hydrate state
  const { data: plannerData } = useFetchPlanner();

  const {
    setPlannerAccounts,
    setPlannerPeople,
    setPlannerAssetFinanceDetailsByAccountId,
    setInflationRate,
    setSafeWithdrawalRate,
    setCurrencyCode,
  } = useCurrentUser();

  useEffect(() => {
    if (!plannerData) return;
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

  // Calculate projections with user's preferences
  const {
    accounts,
    currentAge,
    financialMathSnapshot,
    projectionRows,
    accountBreakdownRows,
    dynamicChartConfig,
    fireTargets,
    baseFinancialFreedomTarget,
    retirementHorizonYears,
    suggestedSafeWithdrawalRate,
    financialFreedomAge,
    coastFireTargetToday,
    coastFireGap,
    hasReachedCoastFire,
    projectedHouseholdIncomeAtRetirement,
    incomeReplacementAnnualNeed,
    incomeReplacementTarget,
    investmentStartingBalance,
    realWeightedAnnualRate,
    monthlyGapToGoal,
    isMonthlyGapPositive,
  } = usePlannerModel();

  // Show loading state while user data loads
  if (!clerkLoaded || !isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="space-y-2 text-center">
          <Loader2 className="text-info mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Future</h1>
        <p className="text-muted-foreground text-sm">Track your path to financial independence</p>
      </div>

      {/* FIRE Targets — inputs + variant cards */}
      <FIRETargetsSection
        fireTargets={fireTargets}
        investmentStartingBalance={investmentStartingBalance}
        realWeightedAnnualRate={realWeightedAnnualRate}
        yearsToGoal={retirementHorizonYears}
        financialFreedomAge={financialFreedomAge}
        coastFireTargetToday={coastFireTargetToday}
        coastFireGap={coastFireGap}
        hasReachedCoastFire={hasReachedCoastFire}
        incomeReplacementTarget={incomeReplacementTarget}
        monthlyGapToGoal={monthlyGapToGoal}
        isMonthlyGapPositive={isMonthlyGapPositive}
      />

      {/* Projections — chart, breakdown, summary */}
      <ProjectionsSection
        currentAge={currentAge}
        financialFreedomAge={financialFreedomAge}
        chartConfig={dynamicChartConfig}
        projectionRows={projectionRows}
        accounts={accounts}
        accountLineColors={accountLineColors}
        accountBreakdownRows={accountBreakdownRows}
        financialMathSnapshot={financialMathSnapshot}
        collapses={{
          requiredMonthly: collapsedSections['requiredMonthly'],
          plannedMonthly: collapsedSections['plannedMonthly'],
          retirementEstimateCard: collapsedSections['retirementEstimateCard'],
          accountBreakdown: collapsedSections['accountBreakdown'],
          onToggle: toggleSection,
        }}
      />
    </div>
  );
}
