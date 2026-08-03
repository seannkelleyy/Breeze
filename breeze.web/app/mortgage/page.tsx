'use client';

import { useState } from 'react';

import { FormattedNumberInput } from '../../components/common/form/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlannerToolsCard } from './components/PlannerToolsCard';

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const MortgageTools = () => {
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

  const [mortgageBalance, setMortgageBalance] = useState(410000);
  const [mortgageOriginalAmount, setMortgageOriginalAmount] = useState(450000);
  const [mortgageRate, setMortgageRate] = useState(6.25);
  const [mortgagePayment, setMortgagePayment] = useState(2850);
  const [mortgageRemainingMonths, setMortgageRemainingMonths] = useState(324);
  const [homeValue, setHomeValue] = useState(625000);
  const [homeAnnualGrowthRate, setHomeAnnualGrowthRate] = useState(4);

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
