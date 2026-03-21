'use client';
import { useCallback, useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  accountLineColors,
  clamp,
  getDefaultAssetFinanceDetailsForAccount,
  normalizeBonusMode,
} from './lib/plannerMath';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useFetchPlanner,
  usePlannerModel,
  usePlannerPersistence,
  usePutPlanner,
} from './hooks/planner/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import AccountsCard from './components/AccountsCard';
import FinancialMathCard from './components/FinancialMathCard';
import PeopleCard from './components/PeopleCard';
import ProjectionChartCard from './components/ProjectionChartCard';
import ProjectionTables from './components/ProjectionTables';
import { RetirementInputsCard } from './components/RetirementInputsCard';
import { SummaryCards } from './components/SummaryCards';
import { isCombinedAssetType } from './lib/config';
import { PlannerAccount } from './types/account';
import { AssetFinanceDetails } from './types/finance';
import { PlannerPerson } from './types/person';
import { PlannerUpsertRequest, SectionKey } from './types/planner';
import {
  PLANNER_DEFAULT_COLLAPSED_SECTIONS,
  PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE,
} from './lib/constants';

type PlannerSection = 'inputs' | 'targets' | 'projections' | 'household' | 'accounts';

const Planner = () => {
  const {
    isSignedIn,
    inflationRate,
    setInflationRate,
    safeWithdrawalRate,
    setSafeWithdrawalRate,
    plannerDesiredInvestmentAmount,
    setPlannerDesiredInvestmentAmount,
    plannerMonthlyExpenses,
    setPlannerMonthlyExpenses,
    plannerPeople,
    setPlannerPeople,
    plannerAccounts,
    setPlannerAccounts,
    plannerAssetFinanceDetailsByAccountId,
    setPlannerAssetFinanceDetailsByAccountId,
  } = useCurrentUser();
  const desiredInvestmentAmount = plannerDesiredInvestmentAmount;
  const people = plannerPeople;
  const monthlyExpenses = plannerMonthlyExpenses;
  const accounts = plannerAccounts;
  const assetFinanceDetailsByAccountId = plannerAssetFinanceDetailsByAccountId;
  const {
    data: plannerData,
    isLoading: isPlannerLoading,
    isError: isPlannerError,
  } = useFetchPlanner();
  const putPlannerMutation = usePutPlanner();
  const {
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

  const getDefaultAssetFinanceDetails = useCallback(
    (account: PlannerAccount): AssetFinanceDetails =>
      getDefaultAssetFinanceDetailsForAccount(account),
    [],
  );

  const createPlannerPayload = useCallback(
    (
      nextDesiredInvestmentAmount: number,
      nextMonthlyExpenses: number,
      nextInflationRate: number,
      nextSafeWithdrawalRate: number,
      nextPeople: PlannerPerson[],
      nextAccounts: PlannerAccount[],
      nextAssetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
    ): PlannerUpsertRequest => ({
      desiredInvestmentAmount: nextDesiredInvestmentAmount,
      monthlyExpenses: nextMonthlyExpenses,
      inflationRate: nextInflationRate,
      safeWithdrawalRate: nextSafeWithdrawalRate,
      people: nextPeople.map((person) => ({
        personType: person.type,
        name: person.name,
        birthday: person.birthday,
        retirementAge: clamp(person.retirementAge),
        annualSalary: clamp(person.annualSalary),
        bonusMode: normalizeBonusMode(person.bonusMode),
        annualBonus: clamp(person.annualBonus),
        incomeGrowthRate: person.incomeGrowthRate,
      })),
      accounts: nextAccounts.map((account) => {
        const details = isCombinedAssetType(account.accountType)
          ? (nextAssetFinanceDetailsByAccountId[account.id] ??
            getDefaultAssetFinanceDetails(account))
          : undefined;

        return {
          name: account.name,
          owner: account.owner,
          accountType: account.accountType,
          contributionMode: account.contributionMode,
          contributionValue: clamp(account.contributionValue),
          employerMatchRate: clamp(account.employerMatchRate),
          employerMatchMaxPercentOfSalary: clamp(account.employerMatchMaxPercentOfSalary),
          startingBalance: clamp(account.startingBalance),
          annualRate: account.annualRate,
          purchaseDate: details?.purchaseDate || null,
          purchasePrice: details ? clamp(details.purchasePrice) : null,
          currentValue: details ? clamp(details.currentValue) : null,
          annualChangeRate: details ? details.annualChangeRate : null,
          homeGrowthProfile: details?.homeGrowthProfile ?? null,
          vehicleDepreciationProfile: details?.vehicleDepreciationProfile ?? null,
          hasLoan: details?.hasLoan ?? false,
          loanInterestRate: details?.hasLoan ? details.loanInterestRate : null,
          originalLoanAmount: details?.hasLoan ? clamp(details.originalLoanAmount) : null,
          loanMonthlyPayment: details?.hasLoan ? clamp(details.loanMonthlyPayment) : null,
          loanTermYears: details?.hasLoan
            ? Math.max(1, Math.round(clamp(details.loanTermYears)))
            : null,
          loanStartDate: details?.hasLoan ? details.loanStartDate : null,
          currentLoanBalance: details?.hasLoan ? clamp(details.currentLoanBalance) : null,
        };
      }),
    }),
    [getDefaultAssetFinanceDetails],
  );

  const { hasPlannerSaveError, lastPlannerSavedAt } = usePlannerPersistence({
    isSignedIn,
    isPlannerLoading,
    isPlannerError,
    plannerData,
    putPlannerMutation,
    createPlannerPayload,
    desiredInvestmentAmount,
    monthlyExpenses,
    inflationRate,
    safeWithdrawalRate,
    people,
    accounts,
    assetFinanceDetailsByAccountId,
    setDesiredInvestmentAmount: setPlannerDesiredInvestmentAmount,
    setMonthlyExpenses: setPlannerMonthlyExpenses,
    setInflationRate,
    setSafeWithdrawalRate,
    setPeople: setPlannerPeople,
    setAccounts: setPlannerAccounts,
    setAssetFinanceDetailsByAccountId: setPlannerAssetFinanceDetailsByAccountId,
  });

  const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
    ...PLANNER_DEFAULT_COLLAPSED_SECTIONS,
  });
  const [activeSection, setActiveSection] = useState<PlannerSection>('inputs');

  const toggleSection = (sectionKey: SectionKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const renderCollapseToggle = (sectionKey: SectionKey) => (
    <Button type="button" variant="ghost" size="icon" onClick={() => toggleSection(sectionKey)}>
      {collapsedSections[sectionKey] ? <ChevronDown /> : <ChevronUp />}
    </Button>
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Net Worth + Retirement Planner</h1>
        <p className="text-muted-foreground mt-1">
          Track all account types in one place and compare your retirement target against your
          projected net worth.
        </p>
        {putPlannerMutation.isPending ? (
          <p className="text-muted-foreground mt-2 text-sm">Saving changes...</p>
        ) : null}
        {!hasPlannerSaveError && !putPlannerMutation.isPending && lastPlannerSavedAt ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Last saved at{' '}
            {lastPlannerSavedAt.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        ) : null}
        {hasPlannerSaveError ? (
          <p className="text-destructive mt-2 text-sm">
            Changes failed to save. Please verify the API is running and try again.
          </p>
        ) : null}
      </div>

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as PlannerSection)}
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-9 w-full justify-center gap-1">
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="household">Household</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="inputs" className="space-y-6">
          <RetirementInputsCard
            collapsed={collapsedSections.retirementInputs}
            toggleControl={renderCollapseToggle('retirementInputs')}
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
        </TabsContent>
        <TabsContent value="targets" className="space-y-6">
          <SummaryCards
            requiredMonthlyCollapsed={collapsedSections.requiredMonthly}
            requiredMonthlyToggleControl={renderCollapseToggle('requiredMonthly')}
            plannedMonthlyCollapsed={collapsedSections.plannedMonthly}
            plannedMonthlyToggleControl={renderCollapseToggle('plannedMonthly')}
            retirementNeedCollapsed={collapsedSections.retirementEstimateCard}
            retirementNeedToggleControl={renderCollapseToggle('retirementEstimateCard')}
          />
        </TabsContent>
        <TabsContent value="projections" className="space-y-6">
          <ProjectionChartCard
            collapsed={collapsedSections.projectionChart}
            toggleControl={renderCollapseToggle('projectionChart')}
            currentAge={currentAge}
            chartConfig={dynamicChartConfig}
            projectionRows={projectionRows}
            accounts={accounts}
            accountLineColors={accountLineColors}
          />
          <ProjectionTables
            sections={{
              yearlyCollapsed: collapsedSections.yearlyProjection,
              yearlyToggleControl: renderCollapseToggle('yearlyProjection'),
              accountBreakdownCollapsed: collapsedSections.accountBreakdown,
              accountBreakdownToggleControl: renderCollapseToggle('accountBreakdown'),
            }}
            data={{ projectionRows, accountBreakdownRows }}
          />
        </TabsContent>
        <TabsContent value="household" className="space-y-6">
          <PeopleCard
            collapsed={collapsedSections.people}
            toggleControl={renderCollapseToggle('people')}
          />
        </TabsContent>
        <TabsContent value="accounts" className="space-y-6">
          <AccountsCard
            collapsed={collapsedSections.accounts}
            toggleControl={renderCollapseToggle('accounts')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Planner;
