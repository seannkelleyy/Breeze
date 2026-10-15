'use client';

import { Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'recharts';
import { Loader2, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { RequireAuth } from '@/components/common/auth/RequireAuth';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import BreezeLineChart from '@/components/common/charts/BreezeLineChart';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_LIABILITIES_BY_USER } from '@/lib/services/queries/assets';
import { buildDebtPayoffPlan, type DebtPayoffDebt } from '@/lib/calc/debtPayoff';
import { formatCurrencyWithCode } from '@/lib/utils';

const LINE_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--chart-9)',
  'var(--chart-10)',
  'var(--chart-11)',
];

interface LiabilityRow {
  id: string;
  name: string;
  liabilityType: string;
  currentBalance: string;
  interestRate: string;
  minimumPayment: string;
  payoffPriority: number;
}

const debtFreeDate = (months: number | null): string => {
  if (months === null) return 'Never at this rate';
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function DebtsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <RequireAuth>
        <DebtsContent />
      </RequireAuth>
    </Suspense>
  );
}

function DebtsContent() {
  const { userId, currencyCode, payoffStrategy, updatePayoffStrategy } = useCurrentUser();
  const { request } = useGraphql();
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  const { data: liabilities, isLoading } = useQuery({
    queryKey: ['debts-payoff', userId],
    queryFn: async () => {
      const resp = await request<{ liabilities: LiabilityRow[] }>(GET_LIABILITIES_BY_USER, {
        userId,
      });
      return resp.liabilities ?? [];
    },
    enabled: !!userId,
  });

  const [extraPayment, setExtraPayment] = useState(0);

  const debts: DebtPayoffDebt[] = useMemo(
    () =>
      (liabilities ?? [])
        .map((l) => ({
          id: l.id,
          name: l.name,
          liabilityType: l.liabilityType,
          balance: Number(l.currentBalance),
          annualRatePercent: Number(l.interestRate) * 100,
          minimumPayment: Number(l.minimumPayment),
        }))
        .filter((d) => d.balance > 0),
    [liabilities],
  );

  const plan = useMemo(
    () =>
      buildDebtPayoffPlan({
        debts,
        extraMonthlyPayment: extraPayment,
        strategy: payoffStrategy,
      }),
    [debts, extraPayment, payoffStrategy],
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    debts.forEach((debt, index) => {
      config[debt.id] = { label: debt.name, color: LINE_PALETTE[index % LINE_PALETTE.length] };
    });
    return config;
  }, [debts]);

  const chartData = useMemo(() => {
    // Sample the timeline so long plans stay chartable.
    const step = Math.max(1, Math.ceil(plan.timeline.length / 240));
    return plan.timeline.filter((_, i) => i % step === 0 || i === plan.timeline.length - 1);
  }, [plan.timeline]);

  const nameById = useMemo(
    () => Object.fromEntries(debts.map((d) => [d.id, d.name])),
    [debts],
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-24 pb-12">
        <PageHeader
          icon={TrendingDown}
          title="Debt Payoff"
          subtitle="Avalanche or snowball — the order, the timeline, and what the extra payment saves."
        />
        <Card>
          <CardContent className="text-muted-foreground flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your debts…
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={TrendingDown}
        title="Debt Payoff"
        subtitle="Avalanche or snowball — the order, the timeline, and what the extra payment saves."
      />

      {debts.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No open debts — add liabilities on the Accounts page to plan a payoff.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_220px]">
            <div className="space-y-1">
              <Label>Strategy</Label>
              <Select
                value={payoffStrategy}
                onValueChange={(v) =>
                  updatePayoffStrategy(v as 'AVALANCHE' | 'SNOWBALL')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVALANCHE">
                    Avalanche — highest interest rate first
                  </SelectItem>
                  <SelectItem value="SNOWBALL">Snowball — smallest balance first</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Extra payment / month</Label>
              <FormattedNumberInput
                value={extraPayment}
                onValueChange={setExtraPayment}
                maxFractionDigits={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Debt-free</CardDescription>
                <CardTitle className="text-success text-2xl">
                  {debtFreeDate(plan.debtFreeMonth)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {plan.debtFreeMonth !== null && `${plan.debtFreeMonth} months from now`}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Interest saved</CardDescription>
                <CardTitle className="text-success text-2xl">{fc(plan.interestSaved)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                vs minimums only, rolled ({fc(plan.totalInterest)} still paid)
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Months saved</CardDescription>
                <CardTitle className="text-2xl">
                  {plan.monthsSaved !== null ? `${plan.monthsSaved} months` : '—'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                Minimums-only: {debtFreeDate(plan.baseline.debtFreeMonth)}
              </CardContent>
            </Card>
          </div>

          {plan.unpayable.length > 0 && (
            <Card>
              <CardContent className="text-destructive py-4 text-sm">
                These debts charge more monthly interest than their minimum covers, so the balance
                grows no matter what: {plan.unpayable.map((id) => nameById[id]).join(', ')}. Raise
                the minimums on the Accounts page.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payoff order</CardTitle>
              <CardDescription>
                {payoffStrategy === 'AVALANCHE'
                  ? 'Highest interest rate first — the cheapest path on paper.'
                  : 'Smallest balance first — the fastest wins to build momentum.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {plan.perDebt
                .slice()
                .sort((a, b) => (a.payoffMonth ?? 99999) - (b.payoffMonth ?? 99999))
                .map((debtResult, index) => (
                  <div
                    key={debtResult.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span className="truncate font-medium">{debtResult.name}</span>
                    </div>
                    <div className="text-muted-foreground flex shrink-0 gap-4 text-xs">
                      <span>
                        {debtResult.payoffMonth !== null
                          ? debtFreeDate(debtResult.payoffMonth)
                          : 'never'}
                      </span>
                      <span>{fc(debtResult.totalInterest)} interest</span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance timeline</CardTitle>
              <CardDescription>
                Every debt&apos;s balance month by month under this plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BreezeLineChart
                config={chartConfig}
                className="h-[260px] w-full"
                data={chartData}
                xAxisDataKey="month"
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                leftAxis={{
                  yAxisId: 'left',
                  tickFormatter: (value: number) => {
                    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return `${value}`;
                  },
                }}
                tooltipFormatter={(value: number, name: string) => `${fc(value)} — ${name}`}
              >
                {debts.map((debt) => (
                  <Line
                    key={debt.id}
                    type="monotone"
                    dataKey={debt.id}
                    stroke={`var(--color-${debt.id})`}
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                  />
                ))}
              </BreezeLineChart>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
