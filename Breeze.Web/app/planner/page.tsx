'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { usePlannerModel } from './hooks/planner/index';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { usePlannerState } from './hooks/usePlannerState';
import { usePlannerPersist, PersistablePreferences } from './hooks/usePlannerPersist';
import { useRetirementAccounts } from './hooks/useRetirementAccounts';
import { useAssetsLiabilities } from './hooks/useAssetsLiabilities';
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

  // Step 1: Authenticate user and sync with backend
  const {
    userId,
    user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    isCreatingUser,
  } = useAuthenticatedUser();

  // Log auth state for debugging
  useEffect(() => {
    console.log('[PlannerPage] Auth state:', {
      clerkLoaded,
      userId,
      user: user ? { id: user.id, email: user.email } : null,
      isUserLoading,
      isUserError,
      userError: userError?.message,
      isCreatingUser,
    });
  }, [userId, user, isUserLoading, isUserError, userError, clerkLoaded, isCreatingUser]);

  // Step 2: Load user's persisted data (hooks populate React Query cache for sections)
  useRetirementAccounts(userId);
  useAssetsLiabilities(userId);

  // Step 3: Initialize preferences for persistence
  const [preferences, setPreferences] = useState<PersistablePreferences>({
    inflationRate: 2.5,
    safeWithdrawalRate: 4,
    filingStatus: 'SINGLE',
    returnType: 'NOMINAL',
    currencyType: 'USD',
    deductionType: 'STANDARD',
    deductionAmount: '13850',
  });

  // Hydrate preferences from user profile when loaded
  useEffect(() => {
    if (user && user.inflationRate) {
      const newPreferences: PersistablePreferences = {
        inflationRate: parseFloat(user.inflationRate || '2.5') * 100,
        safeWithdrawalRate: parseFloat(user.safeWithdrawalRate || '0.04') * 100,
        filingStatus: user.filingStatus || 'SINGLE',
        returnType: user.returnType || 'NOMINAL',
        currencyType: user.currencyType || 'USD',
        deductionType: user.deductionType || 'STANDARD',
        deductionAmount: user.deductionAmount,
      };

      // Only update if preferences have changed
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreferences((prev) =>
        JSON.stringify(prev) !== JSON.stringify(newPreferences) ? newPreferences : prev,
      );
    }
  }, [user]);

  // Step 4: Setup persistence with debounced auto-save
  const { saveStatus, isSaving, isSaved, hasError } = usePlannerPersist(userId, preferences);

  // Step 5: Manage local UI state
  const {
    collapsedSections,
    activeTab: uiActiveTab,
    toggleSection,
    setActiveTab,
    clearValidationErrors,
  } = usePlannerState();

  // Step 6: Calculate projections with user's preferences
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

  // Track if data is ready
  const isDataReady = !isUserLoading && userId;
  const isInitializing = isUserLoading || !clerkLoaded;

  // Show error if user auth failed
  if (clerkLoaded && isUserError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load your profile</p>
              <p className="mt-1 text-sm text-red-800">Please try logging in again.</p>
              {userError && <p className="mt-2 text-sm text-red-700">{userError.message}</p>}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Planner</h1>
          <p className="text-muted-foreground mt-1">
            {isInitializing
              ? 'Loading your profile...'
              : 'Plan your path to financial independence'}
          </p>
        </div>

        {/* Save Status Indicator */}
        {isDataReady && (
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </div>
            )}
            {isSaved && !isSaving && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Saved</span>
              </div>
            )}
            {hasError && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Save failed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isInitializing && (
        <div className="flex items-center justify-center py-12">
          <div className="space-y-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="text-muted-foreground">Initializing your planner...</p>
          </div>
        </div>
      )}

      {/* Main Content - Only show when ready */}
      {isDataReady && (
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
              projectionRowsData={projectionRows}
              accountBreakdownRowsData={accountBreakdownRows}
              requiredMonthlyCollapsed={collapsedSections['requiredMonthly']}
              plannedMonthlyCollapsed={collapsedSections['plannedMonthly']}
              retirementNeedCollapsed={collapsedSections['retirementEstimateCard']}
              yearlyCollapsed={collapsedSections['yearlyProjection']}
              accountBreakdownCollapsed={collapsedSections['accountBreakdown']}
              onToggleRequiredMonthly={() => toggleSection('requiredMonthly')}
              onTogglePlannedMonthly={() => toggleSection('plannedMonthly')}
              onToggleRetirementNeed={() => toggleSection('retirementEstimateCard')}
              onToggleYearly={() => toggleSection('yearlyProjection')}
              onToggleAccountBreakdown={() => toggleSection('accountBreakdown')}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
