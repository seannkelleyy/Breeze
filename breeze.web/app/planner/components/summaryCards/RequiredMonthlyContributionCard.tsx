import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RequiredMonthlyContributionCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
  monthlyNeededForDesiredTarget: number;
  requiredMonthlyTargetLabel: string;
  annualHouseholdIncome: number;
  weightedAnnualRate: number;
  yearsToGoal: number;
  currentSavingsRateEmployeePercent: number;
  currentSavingsRateTotalPercent: number;
  requiredSavingsRatePercent: number;
  savingsRateGapPercent: number;
  monthlyGapToGoal: number;
  isMonthlyGapPositive: boolean;
  formatCurrency: (value: number) => string;
}

const RequiredMonthlyContributionCard = ({
  collapsed,
  toggleControl,
  monthlyNeededForDesiredTarget,
  requiredMonthlyTargetLabel,
  annualHouseholdIncome,
  weightedAnnualRate,
  yearsToGoal,
  currentSavingsRateTotalPercent,
  requiredSavingsRatePercent,
  savingsRateGapPercent,
  monthlyGapToGoal,
  isMonthlyGapPositive,
  formatCurrency,
}: RequiredMonthlyContributionCardProps) => {
  const isOnTrack = savingsRateGapPercent >= 0;
  const savingsProgress = Math.min(
    100,
    (currentSavingsRateTotalPercent / Math.max(requiredSavingsRatePercent, 0.01)) * 100,
  );
  const monthlyProgress = Math.min(100, monthlyGapToGoal > 0 ? 100 : 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Required Monthly Contribution</CardTitle>
          <CardDescription>
            Monthly amount needed to hit your target by retirement age.
          </CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-4">
          <div>
            <p
              className={cn('text-3xl font-bold', isOnTrack ? 'text-success' : 'text-destructive')}
            >
              {formatCurrency(monthlyNeededForDesiredTarget)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Based on: {requiredMonthlyTargetLabel}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">Savings Rate</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isOnTrack ? 'text-success' : 'text-destructive',
                )}
              >
                {currentSavingsRateTotalPercent.toFixed(1)}% /{' '}
                {requiredSavingsRatePercent.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={savingsProgress}
              className={cn(
                'h-2',
                isOnTrack
                  ? '[&>[data-slot=progress-indicator]]:bg-success'
                  : '[&>[data-slot=progress-indicator]]:bg-destructive',
              )}
            />
            <p className={cn('text-xs', isOnTrack ? 'text-success' : 'text-destructive')}>
              {isOnTrack
                ? `On track — ${savingsRateGapPercent.toFixed(1)}% above required`
                : `${Math.abs(savingsRateGapPercent).toFixed(1)}% below required rate`}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">Monthly Plan vs Required</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isMonthlyGapPositive ? 'text-success' : 'text-destructive',
                )}
              >
                {isMonthlyGapPositive ? '+' : ''}
                {formatCurrency(monthlyGapToGoal)}/mo
              </span>
            </div>
            <Progress
              value={monthlyProgress}
              className={cn(
                'h-2',
                isMonthlyGapPositive
                  ? '[&>[data-slot=progress-indicator]]:bg-success'
                  : '[&>[data-slot=progress-indicator]]:bg-destructive',
              )}
            />
            <p
              className={cn('text-xs', isMonthlyGapPositive ? 'text-success' : 'text-destructive')}
            >
              {isMonthlyGapPositive
                ? `Planned total is ${formatCurrency(monthlyGapToGoal)}/mo above required`
                : `Planned total is ${formatCurrency(Math.abs(monthlyGapToGoal))}/mo below required`}
            </p>
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>Return: {weightedAnnualRate.toFixed(2)}%</span>
            <span>Years: {Number.isFinite(yearsToGoal) ? yearsToGoal : 0}</span>
            <span>Income: {formatCurrency(annualHouseholdIncome)}</span>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default RequiredMonthlyContributionCard;
