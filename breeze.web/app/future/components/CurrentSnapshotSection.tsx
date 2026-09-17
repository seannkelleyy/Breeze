'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyWithCode } from '../lib/plannerMath';

interface CurrentSnapshotSectionProps {
  annualHouseholdIncome: number;
  monthlyExpenses: number;
  totalPlannedMonthlyInvestment: number;
  currentSavingsRate: number;
  totalAssets: number;
  totalLiabilities: number;
  currencyCode: string;
}

export function CurrentSnapshotSection({
  annualHouseholdIncome,
  monthlyExpenses,
  totalPlannedMonthlyInvestment,
  currentSavingsRate,
  totalAssets,
  totalLiabilities,
  currencyCode,
}: CurrentSnapshotSectionProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const netWorth = totalAssets - totalLiabilities;
  const monthlyIncome = annualHouseholdIncome / 12;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Current Snapshot</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">Monthly Income</p>
            <p className="text-lg font-semibold">{fc(monthlyIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">Monthly Expenses</p>
            <p className="text-lg font-semibold">{fc(monthlyExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">Monthly Savings</p>
            <p className="text-lg font-semibold">{fc(totalPlannedMonthlyInvestment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">Savings Rate</p>
            <p className="text-lg font-semibold">{currentSavingsRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">Net Worth</p>
            <p className="text-lg font-semibold">{fc(netWorth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">Investments</p>
            <p className="text-lg font-semibold">{fc(totalAssets - totalLiabilities)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
