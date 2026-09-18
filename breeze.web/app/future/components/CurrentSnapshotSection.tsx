'use client';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyWithCode } from '@/lib/utils';

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
  const monthlySavings = totalPlannedMonthlyInvestment;
  const yearlyExpenses = monthlyExpenses * 12;
  const yearlyIncome = annualHouseholdIncome;
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Current Snapshot</h2>
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Income
              </p>
              <p className="text-lg font-semibold">
                {fc(monthlyIncome)}{' '}
                <span className="text-muted-foreground text-xs font-normal">per month</span>
              </p>
              <p className="text-muted-foreground text-xs">({fc(yearlyIncome)} per year)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Expenses
              </p>
              <p className="text-lg font-semibold">
                {fc(monthlyExpenses)}{' '}
                <span className="text-muted-foreground text-xs font-normal">per month</span>
              </p>
              <p className="text-muted-foreground text-xs">({fc(yearlyExpenses)} per year)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Savings
              </p>
              <p className="text-lg font-semibold">
                {fc(monthlySavings)}{' '}
                <span className="text-muted-foreground text-xs font-normal">per month</span>
              </p>
              <p className="text-muted-foreground text-xs">
                ({fc(yearlySavings)} per year · {currentSavingsRate.toFixed(1)}% rate)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Net Worth
              </p>
              <p className="text-lg font-semibold">{fc(netWorth)}</p>
              <p className="text-muted-foreground text-xs">
                ({fc(totalAssets)} assets · {fc(totalLiabilities)} liabilities)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
