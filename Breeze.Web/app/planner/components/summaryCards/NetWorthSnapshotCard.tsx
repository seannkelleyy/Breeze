import { type ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalStartingBalance)}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Total assets: {formatCurrency(totalAssets)}.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Total liabilities: {formatCurrency(totalLiabilities)}.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Projected net worth at age {targetAge}: {formatCurrency(projectedNetWorthAtTargetAge)}.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Planned monthly contribution across all assets:{' '}
            {formatCurrency(totalPlannedMonthlyInvestment)}.
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default NetWorthSnapshotCard;
