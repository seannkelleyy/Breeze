'use client';

import { useEffect, useRef, useState } from 'react';

import { FormattedNumberInput } from '../../components/common/form/FormattedNumberInput';
import { Navigation } from '../../components/common/navigation';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlannerToolsCard } from './components/PlannerToolsCard';
import { useFetchPlanner } from '../planner/hooks/planner/index';
import { de } from 'zod/v4/locales';

interface PlannerAccountLite {
  owner: 'self' | 'spouse';
  accountType: string;
  contributionMode: 'monthly' | 'yearly' | 'salary-percent';
  contributionValue: number;
  employerMatchRate: number;
  employerMatchMaxPercentOfSalary: number;
  startingBalance: number;
  annualRate: number;
  name: string;
  currentValue?: number | null;
  annualChangeRate?: number | null;
  hasLoan: boolean;
  loanInterestRate?: number | null;
  originalLoanAmount?: number | null;
  loanMonthlyPayment?: number | null;
  loanTermYears?: number | null;
  loanStartDate?: string | null;
  currentLoanBalance?: number | null;
}

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

const getMonthsBetween = (from: Date, to: Date) => {
  const monthDelta =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (monthDelta <= 0) {
    return 0;
  }

  return to.getDate() >= from.getDate() ? monthDelta : monthDelta - 1;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const MortgageTools = () => {
  const hasHydratedFromPlannerRef = useRef(false);
  const {
    data: plannerData,
    isLoading: isPlannerLoading,
    isError: isPlannerError,
  } = useFetchPlanner();
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

  const [mortgageBalance, setMortgageBalance] = useState(410000);
  const [mortgageOriginalAmount, setMortgageOriginalAmount] = useState(450000);
  const [mortgageRate, setMortgageRate] = useState(6.25);
  const [mortgagePayment, setMortgagePayment] = useState(2850);
  const [mortgageRemainingMonths, setMortgageRemainingMonths] = useState(324);
  const [homeValue, setHomeValue] = useState(625000);
  const [homeAnnualGrowthRate, setHomeAnnualGrowthRate] = useState(4);

  useEffect(() => {
    if (hasHydratedFromPlannerRef.current || isPlannerLoading || isPlannerError || !plannerData) {
      return;
    }

    const hasPlannerData =
      (plannerData.people ?? []).length > 0 || (plannerData.accounts ?? []).length > 0;
    if (!hasPlannerData) {
      hasHydratedFromPlannerRef.current = true;
      return;
    }

    const accounts = plannerData.accounts as PlannerAccountLite[];
    const now = new Date();

    const homeWithLoan = accounts.find(
      (account) => account.accountType === 'home' && account.hasLoan,
    );
    const homeAccount = homeWithLoan ?? accounts.find((account) => account.accountType === 'home');
    if (homeAccount) {
      setHomeValue(clamp(homeAccount.currentValue ?? homeAccount.startingBalance));
      setHomeAnnualGrowthRate(homeAccount.annualChangeRate ?? homeAccount.annualRate);
      setMortgageOriginalAmount(
        clamp(
          homeAccount.originalLoanAmount ??
            homeAccount.currentLoanBalance ??
            mortgageOriginalAmount,
        ),
      );
      setMortgageBalance(clamp(homeAccount.currentLoanBalance ?? mortgageBalance));
      setMortgageRate(clamp(homeAccount.loanInterestRate ?? mortgageRate));
      setMortgagePayment(clamp(homeAccount.loanMonthlyPayment ?? mortgagePayment));

      if (homeAccount.loanTermYears && homeAccount.loanStartDate) {
        const loanStartDate = new Date(homeAccount.loanStartDate);
        const elapsedMonths = Number.isNaN(loanStartDate.getTime())
          ? 0
          : getMonthsBetween(loanStartDate, now);
        const totalMonths = Math.max(1, Math.round(clamp(homeAccount.loanTermYears) * 12));
        setMortgageRemainingMonths(Math.max(1, totalMonths - elapsedMonths));
      } else if (homeAccount.loanTermYears) {
        setMortgageRemainingMonths(Math.max(1, Math.round(clamp(homeAccount.loanTermYears) * 12)));
      }
    }

    hasHydratedFromPlannerRef.current = true;
  }, [
    isPlannerLoading,
    isPlannerError,
    plannerData,
    mortgageBalance,
    mortgageOriginalAmount,
    mortgagePayment,
    mortgageRate,
  ]);

  const homeLoan = {
    accountName: 'Primary Home Loan',
    currentBalance: clamp(mortgageBalance),
    originalLoanAmount: clamp(mortgageOriginalAmount),
    interestRate: clamp(mortgageRate),
    monthlyPayment: clamp(mortgagePayment),
    remainingMonths: Math.max(1, Math.round(clamp(mortgageRemainingMonths))),
    currentHomeValue: clamp(homeValue),
    homeAnnualGrowthRate: clamp(homeAnnualGrowthRate),
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Mortgage Tools</h1>
        <p className="text-muted-foreground mt-1">
          Analyze amortization, refinance choices, and extra payment strategies.
        </p>
        {isPlannerLoading ? (
          <p className="text-muted-foreground mt-1 text-xs">
            Loading planner profile for prefill...
          </p>
        ) : null}
        {!isPlannerLoading && !isPlannerError && plannerData ? (
          <p className="text-muted-foreground mt-1 text-xs">
            Scenario inputs prefill from your existing planner people/accounts when available.
          </p>
        ) : null}
        {isPlannerError ? (
          <p className="text-destructive mt-1 text-xs">
            Unable to prefill from planner profile. Using manual inputs.
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Inputs</CardTitle>
          <CardDescription>
            Set your current mortgage assumptions for the tools below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Mortgage Balance</Label>
            <FormattedNumberInput
              value={mortgageBalance}
              onValueChange={setMortgageBalance}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Original Loan Amount</Label>
            <FormattedNumberInput
              value={mortgageOriginalAmount}
              onValueChange={setMortgageOriginalAmount}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Mortgage Rate %</Label>
            <FormattedNumberInput
              value={mortgageRate}
              onValueChange={setMortgageRate}
              maxFractionDigits={3}
            />
          </div>
          <div className="space-y-1">
            <Label>Mortgage Payment</Label>
            <FormattedNumberInput
              value={mortgagePayment}
              onValueChange={setMortgagePayment}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Remaining Months</Label>
            <FormattedNumberInput
              value={mortgageRemainingMonths}
              onValueChange={setMortgageRemainingMonths}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Home Value</Label>
            <FormattedNumberInput
              value={homeValue}
              onValueChange={setHomeValue}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Home Growth %</Label>
            <FormattedNumberInput
              value={homeAnnualGrowthRate}
              onValueChange={setHomeAnnualGrowthRate}
              maxFractionDigits={2}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsToolsCollapsed((prev) => !prev)}
            >
              {isToolsCollapsed ? 'Expand Tools' : 'Collapse Tools'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PlannerToolsCard
        collapsed={isToolsCollapsed}
        toggleControl={null}
        formatCurrency={formatCurrency}
        homeLoan={homeLoan}
      />
    </div>
  );
};

export default MortgageTools;
