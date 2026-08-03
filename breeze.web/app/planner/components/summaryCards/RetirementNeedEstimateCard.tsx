import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RetirementNeedEstimateCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
  annualNeedAtRetirement: number;
  financialFreedomTarget: number;
  monthlyNeededForFreedomTarget: number;
  formatCurrency: (value: number) => string;
  currentPortfolio: number;
  totalPlannedMonthlyInvestment: number;
}

const RetirementNeedEstimateCard = ({
  collapsed,
  toggleControl,
  annualNeedAtRetirement,
  financialFreedomTarget,
  monthlyNeededForFreedomTarget,
  formatCurrency,
  currentPortfolio,
  totalPlannedMonthlyInvestment,
}: RetirementNeedEstimateCardProps) => {
  const progressPct =
    financialFreedomTarget > 0
      ? Math.min(100, (currentPortfolio / financialFreedomTarget) * 100)
      : 0;
  const isOnTrack = totalPlannedMonthlyInvestment >= monthlyNeededForFreedomTarget;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Retirement Need Estimate</CardTitle>
          <CardDescription>Inflation-adjusted spending and freedom target.</CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(annualNeedAtRetirement)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Estimated annual need at retirement
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Portfolio vs Freedom Target</span>
              <span className="font-medium">
                {formatCurrency(currentPortfolio)} / {formatCurrency(financialFreedomTarget)}
              </span>
            </div>
            <Progress
              value={progressPct}
              className="[&>[data-slot=progress-indicator]]:bg-info h-2"
            />
            <p className="text-muted-foreground text-xs">
              {progressPct.toFixed(1)}% toward your freedom target
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monthly needed vs planned</span>
              <span className={cn('font-medium', isOnTrack ? 'text-success' : 'text-destructive')}>
                {formatCurrency(totalPlannedMonthlyInvestment)} /{' '}
                {formatCurrency(monthlyNeededForFreedomTarget)}
              </span>
            </div>
            <p className={cn('text-xs', isOnTrack ? 'text-success' : 'text-destructive')}>
              {isOnTrack
                ? `Planned ${formatCurrency(totalPlannedMonthlyInvestment)}/mo meets the ${formatCurrency(monthlyNeededForFreedomTarget)}/mo needed`
                : `Planned ${formatCurrency(totalPlannedMonthlyInvestment)}/mo is below the ${formatCurrency(monthlyNeededForFreedomTarget)}/mo needed`}
            </p>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default RetirementNeedEstimateCard;
