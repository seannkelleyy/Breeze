'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Target, Calendar, DollarSign } from 'lucide-react';
import { usePlannerModel, useFetchPlanner } from './hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from './hooks/usePlannerState';
import { usePlaidConnections, useSyncPlaidConnection } from '@/lib/services/hooks/usePlaid';
import { formatCurrencyWithCode } from './lib/plannerMath';

import {
  RetirementInputsSection,
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
  const { userId, isLoaded, currencyCode } = useCurrentUser();
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
  } = usePlannerModel();

  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

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

  // Calculate key metrics for summary cards
  const totalAssets = financialMathSnapshot.currentPortfolio;
  const netWorth = totalAssets;
  const fireProgress =
    baseFinancialFreedomTarget > 0
      ? (totalAssets / baseFinancialFreedomTarget) * 100
      : 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Financial Planner</h1>
        <p className="text-muted-foreground text-sm">Track your path to financial independence</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{formatCurrency(netWorth)}</div>
            <p className="text-muted-foreground text-xs">
              {formatCurrency(totalAssets)} in assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FIRE Progress</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{fireProgress.toFixed(1)}%</div>
            <p className="text-muted-foreground text-xs">
              of {formatCurrency(baseFinancialFreedomTarget)} goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{currentAge}</div>
            <p className="text-muted-foreground text-xs">
              {financialFreedomAge ? `Target: ${financialFreedomAge}` : 'Target: TBD'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coast FIRE</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold sm:text-2xl ${hasReachedCoastFire ? 'text-green-600' : ''}`}
            >
              {hasReachedCoastFire ? 'Reached' : 'In Progress'}
            </div>
            <p className="text-muted-foreground text-xs">
              {hasReachedCoastFire
                ? `By ${formatCurrency(Math.abs(coastFireGap))}`
                : `Need ${formatCurrency(Math.abs(coastFireGap))}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Split View: Inputs (left) + Results (right) on desktop, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
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
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
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
              accountBreakdown: collapsedSections['accountBreakdown'],
              onToggle: toggleSection,
            }}
          />
        </div>
      </div>
    </div>
  );
}
