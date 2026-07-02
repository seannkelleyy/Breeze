'use client';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { usePlannerModel, useFetchPlanner } from './hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from './hooks/usePlannerState';

import {
  RetirementInputsSection,
  PeopleSection,
  AccountsSection,
  ProjectionsSection,
} from './components/sections';
import FinancialMathCard from './components/FinancialMathCard';
import { accountLineColors } from './lib/plannerMath';
import { PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE } from './lib/constants';

type PlannerTab = 'inputs' | 'accounts' | 'projections';

export default function PlannerPage() {
  const { isLoaded: clerkLoaded } = useUser();
  const { userId, isLoaded } = useCurrentUser();

  // Manage local UI state
  const {
    collapsedSections,
    activeTab: uiActiveTab,
    toggleSection,
    setActiveTab,
  } = usePlannerState();

  // Load planner data from API on mount and hydrate state
  const { data: plannerData, isLoading: isPlannerLoading } = useFetchPlanner();

  const {
    setPlannerAccounts,
    setInflationRate,
    setSafeWithdrawalRate,
    setCurrencyCode,
    setReturnDisplayMode,
  } = useCurrentUser();

  useEffect(() => {
    if (!plannerData) return;
    setPlannerAccounts(plannerData.accounts);
    setInflationRate(plannerData.inflationRate);
    setSafeWithdrawalRate(plannerData.safeWithdrawalRate);
    setCurrencyCode(plannerData.currencyCode);
    setReturnDisplayMode(plannerData.returnDisplayMode);
  }, [
    plannerData,
    setPlannerAccounts,
    setInflationRate,
    setSafeWithdrawalRate,
    setCurrencyCode,
    setReturnDisplayMode,
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
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
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
        value={uiActiveTab}
        onValueChange={(v) => setActiveTab(v as PlannerTab)}
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
          <FinancialMathCard snapshot={financialMathSnapshot} />
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
