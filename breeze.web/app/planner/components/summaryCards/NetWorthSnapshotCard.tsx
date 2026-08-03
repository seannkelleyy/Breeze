import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface NetWorthSnapshotCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
  totalStartingBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  targetAge: number;
  projectedNetWorthAtTargetAge: number;
  totalPlannedMonthlyInvestment: number;
  formatCurrency: (value: number) => string;
}

const NetWorthSnapshotCard = ({
  collapsed,
  toggleControl,
  totalStartingBalance,
  totalAssets,
  totalLiabilities,
  targetAge,
  projectedNetWorthAtTargetAge,
  totalPlannedMonthlyInvestment,
  formatCurrency,
}: NetWorthSnapshotCardProps) => {
  const isPositive = totalStartingBalance >= 0;
  const hasLiabilities = totalLiabilities > 0;
  const totalValue = totalAssets + totalLiabilities;
  const assetPercent = totalValue > 0 ? (totalAssets / totalValue) * 100 : 100;
  const liabilityPercent = totalValue > 0 ? (totalLiabilities / totalValue) * 100 : 0;
  const targetProgress =
    projectedNetWorthAtTargetAge > 0
      ? Math.min(100, (totalStartingBalance / projectedNetWorthAtTargetAge) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Net Worth Snapshot</CardTitle>
          <CardDescription>Current and projected net worth across all accounts.</CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-4">
          <div>
            <p
              className={cn('text-3xl font-bold', isPositive ? 'text-success' : 'text-destructive')}
            >
              {isPositive ? '' : '-'}
              {formatCurrency(Math.abs(totalStartingBalance))}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {isPositive ? 'Positive net worth' : 'Negative net worth'}
            </p>
          </div>

          {hasLiabilities ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-success font-medium">
                  Assets {formatCurrency(totalAssets)}
                </span>
                <span className="text-destructive font-medium">
                  Liabilities {formatCurrency(totalLiabilities)}
                </span>
              </div>
              <div className="bg-destructive/20 flex h-3 w-full overflow-hidden rounded-full">
                <div
                  className="bg-success h-full rounded-l-full transition-all"
                  style={{ width: `${assetPercent}%` }}
                />
                <div
                  className="bg-destructive h-full rounded-r-full transition-all"
                  style={{ width: `${liabilityPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-success text-xs font-medium">No liabilities</p>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress to target at age {targetAge}</span>
              <span className="font-medium">
                {formatCurrency(totalStartingBalance)} /{' '}
                {formatCurrency(projectedNetWorthAtTargetAge)}
              </span>
            </div>
            <Progress
              value={targetProgress}
              className="[&>[data-slot=progress-indicator]]:bg-info h-2"
            />
          </div>

          <div className="text-muted-foreground text-xs">
            Planned monthly: {formatCurrency(totalPlannedMonthlyInvestment)}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default NetWorthSnapshotCard;
