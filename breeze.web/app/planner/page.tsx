'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { usePlannerModel, useFetchPlanner } from './hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from './hooks/usePlannerState';
import { usePlaidConnections, useSyncPlaidConnection } from '@/lib/services/hooks/usePlaid';

import {
  RetirementInputsSection,
  PeopleSection,
  AccountsSection,
  ProjectionsSection,
} from './components/sections';
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
  const {
    collapsedSections,
    activeTab,
    toggleSection,
    setActiveTab,
  } = usePlannerState();

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
          // If asset has a linked liability, populate loan fields from it
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
    <div className="container mx-auto space-y-6 py-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Planner</h1>
          <p className="text-muted-foreground mt-1">Plan your path to financial independence</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'inputs' | 'accounts' | 'projections')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        {/* Inputs Tab */}
        <TabsContent value="inputs" className="space-y-6">
          <RetirementInputsSection
            isCollapsed={collapsedSections['retirementInputs']}
            onToggle={() => toggleSection('retirementInputs')}
            fireTargets={fireTargets}
            baseFinancialFreedomTarget={baseFinancialFreedomTarget}
            retirementHorizonYears={retirementHorizonYears}
            suggestedSafeWithdrawalRate={suggestedSafeWithdrawalRate}
            financialFreedomAge={financialFreedomAge}
            coastFireTargetToday={coastFireTargetToday}
            coastFireGap={coastFireGap}
            hasReachedCoastFire={hasReachedCoastFire}
            incomeReplacementRate={PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE}
            projectedHouseholdIncomeAtRetirement={projectedHouseholdIncomeAtRetirement}
            incomeReplacementAnnualNeed={incomeReplacementAnnualNeed}
            incomeReplacementTarget={incomeReplacementTarget}
            financialMathSnapshot={financialMathSnapshot}
          />
          <PeopleSection
            isCollapsed={collapsedSections['people']}
            onToggle={() => toggleSection('people')}
          />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <AccountsSection
            isCollapsed={collapsedSections['accounts']}
            onToggle={() => toggleSection('accounts')}
          />
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-6">
          <ProjectionsSection
            currentAge={currentAge}
            chartConfig={dynamicChartConfig}
            projectionRows={projectionRows}
            accounts={accounts}
            accountLineColors={accountLineColors}
            accountBreakdownRows={accountBreakdownRows}
            financialMathSnapshot={financialMathSnapshot}
            hasReachedCoastFire={hasReachedCoastFire}
            coastFireGap={coastFireGap}
            collapses={{
              requiredMonthly: collapsedSections['requiredMonthly'],
              plannedMonthly: collapsedSections['plannedMonthly'],
              retirementEstimateCard: collapsedSections['retirementEstimateCard'],
              yearlyProjection: collapsedSections['yearlyProjection'],
              accountBreakdown: collapsedSections['accountBreakdown'],
              onToggle: toggleSection,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
