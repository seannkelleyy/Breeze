import { type ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RetirementNeedEstimateCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
  annualNeedAtRetirement: number;
  financialFreedomTarget: number;
  monthlyNeededForFreedomTarget: number;
  formatCurrency: (value: number) => string;
}

const RetirementNeedEstimateCard = ({
  collapsed,
  toggleControl,
  annualNeedAtRetirement,
  financialFreedomTarget,
  monthlyNeededForFreedomTarget,
  formatCurrency,
}: RetirementNeedEstimateCardProps) => {
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
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(annualNeedAtRetirement)}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Freedom target: {formatCurrency(financialFreedomTarget)}.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Monthly needed for freedom target: {formatCurrency(monthlyNeededForFreedomTarget)}.
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default RetirementNeedEstimateCard;
