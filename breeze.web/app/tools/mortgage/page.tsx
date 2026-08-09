'use client';

import { Suspense, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { FormattedNumberInput } from '../../../components/common/form/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlannerToolsCard } from './components/PlannerToolsCard';
import { PageHeader } from '@/components/common/PageHeader';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/lib/services/queries/assets';
import { PLANNER_HOME_GROWTH_PROFILE_RATES } from '@/app/future/lib/constants';
import { Home } from 'lucide-react';

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

interface HomeMortgagePair {
  id: string;
  label: string;
  mortgageBalance: number;
  originalLoanAmount: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
  homeValue: number;
  homeAnnualGrowthRate: number;
}

function calculateRemainingMonths(
  balance: number,
  annualRatePercent: number,
  monthlyPayment: number,
): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) {
    return monthlyPayment > 0 ? Math.ceil(balance / monthlyPayment) : 0;
  }
  const numerator = Math.log(1 - (monthlyRate * balance) / monthlyPayment);
  const denominator = Math.log(1 + monthlyRate);
  if (denominator === 0 || !Number.isFinite(numerator)) return 0;
  const months = -numerator / denominator;
  return Math.max(1, Math.round(months));
}

function resolveGrowthRate(profile: string | null): number {
  if (profile && profile in PLANNER_HOME_GROWTH_PROFILE_RATES) {
    return PLANNER_HOME_GROWTH_PROFILE_RATES[
      profile as keyof typeof PLANNER_HOME_GROWTH_PROFILE_RATES
    ];
  }
  return PLANNER_HOME_GROWTH_PROFILE_RATES.medium;
}

const MortgageTools = () => {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();

  const { data: pairs } = useQuery({
    queryKey: ['mortgage-pairs', userId],
    queryFn: async () => {
      const [assetsResp, liabilitiesResp] = await Promise.all([
        request<{
          assets: Array<{
            id: string;
            name: string;
            assetType: string;
            currentValue: string;
            homeGrowthProfile: string | null;
            linkedLiabilityId: string | null;
          }>;
        }>(GET_ASSETS_BY_USER, { userId }),
        request<{
          liabilities: Array<{
            id: string;
            name: string;
            liabilityType: string;
            currentBalance: string;
            originalLoanAmount: string | null;
            interestRate: string;
            minimumPayment: string;
          }>;
        }>(GET_LIABILITIES_BY_USER, { userId }),
      ]);

      const assets = (assetsResp?.assets ?? []).filter((a) => a.assetType === 'HOME');
      const liabilities = liabilitiesResp?.liabilities ?? [];
      const liabilityById = new Map(liabilities.map((l) => [l.id, l]));

      const result: HomeMortgagePair[] = [];
      for (const asset of assets) {
        if (!asset.linkedLiabilityId) continue;
        const liability = liabilityById.get(asset.linkedLiabilityId);
        if (!liability || liability.liabilityType !== 'MORTGAGE') continue;

        const balance = Number(liability.currentBalance) || 0;
        const rate = Number(liability.interestRate) * 100 || 0;
        const payment = Number(liability.minimumPayment) || 0;
        const original = Number(liability.originalLoanAmount) || 0;
        const homeVal = Number(asset.currentValue) || 0;

        result.push({
          id: asset.id,
          label: asset.name,
          mortgageBalance: balance,
          originalLoanAmount: original,
          interestRate: rate,
          monthlyPayment: payment,
          remainingMonths: calculateRemainingMonths(balance, rate, payment),
          homeValue: homeVal,
          homeAnnualGrowthRate: resolveGrowthRate(asset.homeGrowthProfile),
        });
      }

      return result;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const [selectedId, setSelectedId] = useState<string>('manual');
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

  const [mortgageBalance, setMortgageBalance] = useState(410000);
  const [mortgageOriginalAmount, setMortgageOriginalAmount] = useState(450000);
  const [mortgageRate, setMortgageRate] = useState(6.25);
  const [mortgagePayment, setMortgagePayment] = useState(2850);
  const [mortgageRemainingMonths, setMortgageRemainingMonths] = useState(324);
  const [homeValue, setHomeValue] = useState(625000);
  const [homeAnnualGrowthRate, setHomeAnnualGrowthRate] = useState(4);

  const handleSelectPair = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (id === 'manual') return;
      const pair = pairs?.find((p) => p.id === id);
      if (!pair) return;
      setMortgageBalance(pair.mortgageBalance);
      setMortgageOriginalAmount(pair.originalLoanAmount);
      setMortgageRate(pair.interestRate);
      setMortgagePayment(pair.monthlyPayment);
      setMortgageRemainingMonths(pair.remainingMonths);
      setHomeValue(pair.homeValue);
      setHomeAnnualGrowthRate(pair.homeAnnualGrowthRate);
    },
    [pairs],
  );

  const homeLoan = {
    accountName:
      selectedId === 'manual'
        ? 'Primary Home Loan'
        : (pairs?.find((p) => p.id === selectedId)?.label ?? 'Primary Home Loan'),
    currentBalance: clamp(mortgageBalance),
    originalLoanAmount: clamp(mortgageOriginalAmount),
    interestRate: clamp(mortgageRate),
    monthlyPayment: clamp(mortgagePayment),
    remainingMonths: Math.max(1, Math.round(clamp(mortgageRemainingMonths))),
    currentHomeValue: clamp(homeValue),
    homeAnnualGrowthRate: clamp(homeAnnualGrowthRate),
  };

  const hasPairs = (pairs?.length ?? 0) > 0;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={Home}
        title="Mortgage Calculator"
        subtitle="Analyze amortization, refinance choices, and extra payment strategies."
      />

      <Card>
        <CardHeader>
          <CardTitle>Scenario Inputs</CardTitle>
          <CardDescription>
            {hasPairs
              ? 'Select a home from your planner or enter values manually.'
              : 'Set your current mortgage assumptions for the tools below.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {hasPairs && (
            <div className="col-span-full space-y-1">
              <Label>Home</Label>
              <Select value={selectedId} onValueChange={handleSelectPair}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  {pairs!.map((pair) => (
                    <SelectItem key={pair.id} value={pair.id}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

export default function MortgagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <MortgageTools />
    </Suspense>
  );
}
