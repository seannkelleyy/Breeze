'use client';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { formatCurrencyWithCode } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type HealthStatus = 'good' | 'warning' | 'bad';

const statusConfig = {
  good: {
    border: 'border-l-success',
    text: 'text-success',
    dot: 'bg-success',
    label: 'On Track',
  },
  warning: {
    border: 'border-l-warning',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Needs Attention',
  },
  bad: {
    border: 'border-l-destructive',
    text: 'text-destructive',
    dot: 'bg-destructive',
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

export function HealthIndicators() {
  const { plannerSummary, currencyCode, monthlyExpenses, plannerPeople, plannerAccounts } =
    useCurrentUser();
  if (!plannerSummary) return null;

  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  // Calculate total gross income (salary + dollar bonuses)
  const totalAnnualIncome = plannerSummary.annualHouseholdIncome;
  const totalAnnualBonus = plannerPeople.reduce((sum, p) => {
    return sum + (p.bonusMode === 'dollars' ? p.annualBonus : 0);
  }, 0);
  const annualSpend = (monthlyExpenses ?? 0) * 12;
  const annualInvestments = plannerSummary.totalPlannedMonthlyInvestment * 12;
  const annualSavings = Math.max(0, totalAnnualIncome - annualSpend - annualInvestments);
  const savingsRate =
    totalAnnualIncome > 0 ? ((annualInvestments + annualSavings) / totalAnnualIncome) * 100 : 0;

  // Emergency fund months — from emergency-fund and checking accounts
  const emergencyFundBalance = plannerAccounts
    .filter((a) => a.accountType === 'emergency-fund' || a.accountType === 'checking')
    .reduce((sum, a) => sum + a.startingBalance, 0);
  const monthlyExpensesVal = monthlyExpenses ?? 0;
  const emergencyMonths = monthlyExpensesVal > 0 ? emergencyFundBalance / monthlyExpensesVal : 0;

  const emergencyStatus: HealthStatus =
    emergencyMonths >= 6 ? 'good' : emergencyMonths >= 3 ? 'warning' : 'bad';

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

  const indicators = [
    {
      label: 'Gross Income',
      value:
        totalAnnualBonus > 0
          ? `${fc(totalAnnualIncome)} (${fc(totalAnnualBonus)} bonus)`
          : fc(totalAnnualIncome),
      status: 'good' as HealthStatus,
      detail: `Annual household income${totalAnnualBonus > 0 ? ' + bonus' : ''}`,
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
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
      label: 'Emergency Fund',
      value: `${emergencyMonths.toFixed(1)} months`,
      status: emergencyStatus,
      detail:
        emergencyMonths >= 6
          ? 'Fully funded'
          : emergencyMonths >= 3
            ? '3+ months covered'
            : 'Needs attention',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {indicators.map((ind) => (
        <IndicatorCard key={ind.label} {...ind} />
      ))}
    </div>
  );
}

export default HealthIndicators;
