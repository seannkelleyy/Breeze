'use client';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { formatCurrencyWithCode } from '../lib/plannerMath';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HealthIndicatorsProps {
  hasReachedCoastFire: boolean;
  coastFireGap: number;
}

type HealthStatus = 'good' | 'warning' | 'bad';

const statusConfig = {
  good: {
    border: 'border-l-green-500',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    label: 'On Track',
  },
  warning: {
    border: 'border-l-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Needs Attention',
  },
  bad: {
    border: 'border-l-red-500',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Behind',
  },
};

function IndicatorCard({
  label,
  value,
  status,
  detail,
}: {
  label: string;
  value: string;
  status: HealthStatus;
  detail: string;
}) {
  const cfg = statusConfig[status];
  return (
    <Card className={cn('border-l-4', cfg.border)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <span className={cn('inline-block h-2 w-2 rounded-full', cfg.dot)} />
        </div>
        <p className={cn('mt-1 text-lg font-bold', cfg.text)}>{value}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function HealthIndicators({ hasReachedCoastFire, coastFireGap }: HealthIndicatorsProps) {
  const { plannerSummary, currencyCode } = useCurrentUser();
  if (!plannerSummary) return null;

  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  const savingsStatus: HealthStatus =
    plannerSummary.savingsRateGapPercent >= 0
      ? 'good'
      : plannerSummary.savingsRateGapPercent > -5
        ? 'warning'
        : 'bad';

  const monthlyStatus: HealthStatus =
    plannerSummary.monthlyGapToGoal > 0
      ? 'good'
      : plannerSummary.monthlyGapToGoal === 0
        ? 'warning'
        : 'bad';

  const netWorthStatus: HealthStatus =
    plannerSummary.totalStartingBalance > 0
      ? 'good'
      : plannerSummary.totalStartingBalance === 0
        ? 'warning'
        : 'bad';

  const coastStatus: HealthStatus = hasReachedCoastFire ? 'good' : 'bad';

  const indicators = [
    {
      label: 'Savings Rate',
      value: `${plannerSummary.savingsRateGapPercent >= 0 ? '+' : ''}${plannerSummary.savingsRateGapPercent.toFixed(1)}%`,
      status: savingsStatus,
      detail:
        plannerSummary.savingsRateGapPercent >= 0
          ? `${plannerSummary.currentSavingsRateTotalPercent.toFixed(1)}% vs ${plannerSummary.requiredSavingsRatePercent.toFixed(1)}% required`
          : `At ${plannerSummary.currentSavingsRateTotalPercent.toFixed(1)}%, need ${plannerSummary.requiredSavingsRatePercent.toFixed(1)}%`,
    },
    {
      label: 'Monthly Plan',
      value: plannerSummary.isMonthlyGapPositive
        ? `+${fc(plannerSummary.monthlyGapToGoal)}`
        : `-${fc(Math.abs(plannerSummary.monthlyGapToGoal))}`,
      status: monthlyStatus,
      detail: plannerSummary.isMonthlyGapPositive
        ? 'Planned exceeds required'
        : 'Below required monthly',
    },
    {
      label: 'Net Worth',
      value: fc(plannerSummary.totalStartingBalance),
      status: netWorthStatus,
      detail:
        plannerSummary.totalLiabilities > 0
          ? `${fc(plannerSummary.totalAssets)} assets / ${fc(plannerSummary.totalLiabilities)} liabilities`
          : 'No liabilities',
    },
    {
      label: 'Coast FIRE',
      value: hasReachedCoastFire ? 'Reached' : `${fc(Math.abs(coastFireGap))}`,
      status: coastStatus,
      detail: hasReachedCoastFire
        ? `${fc(Math.abs(coastFireGap))} above target`
        : 'Needed to reach coast FIRE',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {indicators.map((ind) => (
        <IndicatorCard key={ind.label} {...ind} />
      ))}
    </div>
  );
}

export default HealthIndicators;
