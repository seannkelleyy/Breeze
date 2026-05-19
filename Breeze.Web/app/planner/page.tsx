'use client';
import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { accountLineColors } from './lib/plannerMath';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlannerModel } from './hooks/planner/index';
import AccountsCard from './components/AccountsCard';
import FinancialMathCard from './components/FinancialMathCard';
import PeopleCard from './components/PeopleCard';
import ProjectionChartCard from './components/ProjectionChartCard';
import ProjectionTables from './components/ProjectionTables';
import { RetirementInputsCard } from './components/RetirementInputsCard';
import { SummaryCards } from './components/SummaryCards';
import { SectionKey } from './types/planner';
import {
  PLANNER_DEFAULT_COLLAPSED_SECTIONS,
  PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE,
} from './lib/constants';

type PlannerSection = 'inputs' | 'targets' | 'projections' | 'household' | 'accounts';

const Planner = () => {
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
