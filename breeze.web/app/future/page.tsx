'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { usePlannerModel, useFetchPlanner } from './hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from './providers/PlannerStateProvider';
import { usePlannerUiState } from './hooks/usePlannerUiState';
import { usePlaidConnections, useSyncPlaidConnection } from '@/lib/services/hooks/usePlaid';

import { ProjectionsSection } from './components/sections';
import { CurrentSnapshotSection } from './components/CurrentSnapshotSection';
import { RetirementPlannerSection } from './components/RetirementPlannerSection';
import { getDefaultAssetFinanceDetailsForAccount } from './lib/projection';

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
  const { userId, isLoaded, currencyCode } = useCurrentUser();
  const { data: connections } = usePlaidConnections(userId);
  const { mutate: syncConnection } = useSyncPlaidConnection();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!connections || connections.length === 0 || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    for (const conn of connections) {
      syncConnection(conn.id);
    }
  }, [connections, syncConnection]);

  const { collapsedSections, toggleSection } = usePlannerUiState();
  const { data: plannerData } = useFetchPlanner();

  const {
    setPlannerAccounts,
    setPlannerPeople,
    setPlannerAssetFinanceDetailsByAccountId,
  } = usePlannerState();
  const { setInflationRate, setSafeWithdrawalRate, setCurrencyCode } = useCurrentUser();

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

  const {
    accounts,
    currentAge,
    targetAge,
    financialMathSnapshot,
    projectionRows,
    accountBreakdownRows,
    dynamicChartConfig,
    milestones,
    totalStartingBalance,
    investmentStartingBalance,
    realWeightedAnnualRate,
    projectedNetWorthAtTargetAge,
    totalPlannedMonthlyInvestment,
    totalAssets,
    totalLiabilities,
    currentSavingsRate,
    projectionEndAge,
    setProjectionEndAge,
    setRetirementAgeOverride,
    marketAdjustment,
    setMarketAdjustment,
  } = usePlannerModel();

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
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 pt-16 pb-6 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Future</h1>
        <p className="text-muted-foreground text-sm">Track your path to financial independence</p>
      </div>

      <CurrentSnapshotSection
        snapshot={financialMathSnapshot}
        accounts={accounts}
        totalStartingBalance={totalStartingBalance}
        projectedNetWorthAtTargetAge={projectedNetWorthAtTargetAge}
        targetAge={targetAge}
        totalPlannedMonthlyInvestment={totalPlannedMonthlyInvestment}
        currentSavingsRate={currentSavingsRate}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        currencyCode={currencyCode}
      />


      <RetirementPlannerSection
        milestones={milestones}
        currentAge={currentAge}
        targetAge={targetAge}
        investmentStartingBalance={investmentStartingBalance}
        realWeightedAnnualRate={realWeightedAnnualRate}
        projectedNetWorthAtTargetAge={projectedNetWorthAtTargetAge}
        totalPlannedMonthlyInvestment={totalPlannedMonthlyInvestment}
        currencyCode={currencyCode}
      />

      <ProjectionsSection
        currentAge={currentAge}
        targetAge={targetAge}
        retirementAge={targetAge}
        setRetirementAge={setRetirementAgeOverride}
        marketAdjustment={marketAdjustment}
        setMarketAdjustment={setMarketAdjustment}
        chartConfig={dynamicChartConfig}
        projectionRows={projectionRows}
        accounts={accounts}
        accountBreakdownRows={accountBreakdownRows}
        projectionEndAge={projectionEndAge}
        setProjectionEndAge={setProjectionEndAge}
        collapses={{
          accountBreakdown: collapsedSections['accountBreakdown'],
          onToggle: toggleSection,
        }}
      />
    </div>
  );
}
