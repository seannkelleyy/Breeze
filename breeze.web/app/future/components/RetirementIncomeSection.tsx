'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import type { WithdrawalRow } from '../types/projection';
import { formatCurrencyWithCode } from '@/lib/utils';

type RetirementIncomeSectionProps = {
  rows: WithdrawalRow[];
  projectionEndAge: number;
};

const series = [
  { key: 'hsaReceipts', label: 'HSA receipts', color: 'var(--chart-2)' },
  { key: 'taxable', label: 'Taxable', color: 'var(--chart-1)' },
  { key: 'pretax', label: 'Pre-tax', color: 'var(--chart-3)' },
  { key: 'rothClocked', label: 'Roth (clock cleared)', color: 'var(--chart-4)' },
  { key: 'rothOther', label: 'Roth (other)', color: 'var(--chart-5)' },
  { key: 'shortfall', label: 'Shortfall', color: 'var(--destructive)' },
] as const;

/**
 * Income plan: renders the projection engine's sequenced withdrawals — the
 * post-retirement drawdown in tax order (HSA receipts, taxable, pre-tax,
 * clocked Roth conversions, remaining Roth) — as a stacked chart with penalty
 * exposure, first unfunded year, and what's left at the end.
 */
const RetirementIncomeSection = ({ rows, projectionEndAge }: RetirementIncomeSectionProps) => {
  const { currencyCode } = useCurrentUser();
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  if (rows.length === 0) {
    return null;
  }

  const plan = {
    rows,
    totalPenaltyExposure: rows.reduce((sum, r) => sum + r.penaltyExposure, 0),
    firstShortfallAge: rows.find((r) => r.shortfall > 0)?.age ?? null,
    endingPortfolioBalance: rows[rows.length - 1]?.spendableBalance ?? 0,
  };

  const compact = (v: number) => {
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return `${v}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" /> Retirement income plan
        </CardTitle>
        <CardDescription>
          Which dollars fund each retirement year: HSA receipts first (tax-free at any age), then
          taxable, pre-tax, and Roth conversions once their five-year clock clears. Draws before
          59½ from pre-tax or unclocked Roth money flag 10% penalty exposure; federal income tax on
          pre-tax draws is not modeled yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border px-3 py-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Penalty exposure
            </p>
            <p className={plan.totalPenaltyExposure > 0 ? 'text-warning text-lg font-semibold' : 'text-lg font-semibold'}>
              {fc(plan.totalPenaltyExposure)}
            </p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              First unfunded year
            </p>
            <p className="text-lg font-semibold">
              {plan.firstShortfallAge === null
                ? 'None — funded through ' + projectionEndAge
                : `Age ${plan.firstShortfallAge}`}
            </p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Portfolio left at {projectionEndAge}
            </p>
            <p className="text-lg font-semibold">{fc(plan.endingPortfolioBalance)}</p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plan.rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={compact}
                width={56}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                formatter={(value) => fc(Number(value))}
                labelFormatter={(age) => `Age ${age}`}
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="spend"
                  name={s.label}
                  fill={s.color}
                  maxBarSize={36}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetirementIncomeSection;
