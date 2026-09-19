'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrencyWithCode } from '@/lib/utils';
import { isLiabilityAccountType } from '../lib/config';
import type { PlannerAccount } from '../types/account';
import type { FinancialMathSnapshot } from '../types/finance';

interface CurrentSnapshotSectionProps {
  snapshot: FinancialMathSnapshot;
  accounts: PlannerAccount[];
  totalStartingBalance: number;
  projectedNetWorthAtTargetAge: number;
  targetAge: number;
  totalPlannedMonthlyInvestment: number;
  currentSavingsRate: number;
  totalAssets: number;
  totalLiabilities: number;
  currencyCode: string;
}

export function CurrentSnapshotSection({
  snapshot,
  accounts,
  totalStartingBalance,
  projectedNetWorthAtTargetAge,
  targetAge,
  totalPlannedMonthlyInvestment,
  currentSavingsRate,
  totalAssets,
  totalLiabilities,
  currencyCode,
}: CurrentSnapshotSectionProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const monthlyIncome = snapshot.grossIncome / 12;
  const monthlySavings = totalPlannedMonthlyInvestment;
  const yearlySavingsPlanned = monthlySavings * 12;
  const emergencyFundMonths =
    snapshot.monthlyExpenses > 0 ? snapshot.emergencyFundBalance / snapshot.monthlyExpenses : 0;
  // Savings rate is defined against gross income: planned contributions (incl.
  // employer match) divided by gross household income.
  const savingsRateOfGross =
    snapshot.grossIncome > 0
      ? Math.min(100, ((totalPlannedMonthlyInvestment * 12) / snapshot.grossIncome) * 100)
      : 0;

  const assetAccounts = accounts
    .filter((a) => !isLiabilityAccountType(a.accountType) && a.accountType !== 'home' && a.accountType !== 'vehicle')
    .map((a) => ({ id: a.id, name: a.name, balance: a.startingBalance }));
  const liabilityAccounts = accounts
    .filter((a) => isLiabilityAccountType(a.accountType))
    .map((a) => ({ id: a.id, name: a.name, balance: a.startingBalance }));
  const hasLiabilities = totalLiabilities > 0;
  const totalValue = totalAssets + totalLiabilities;
  const assetPercent = totalValue > 0 ? (totalAssets / totalValue) * 100 : 100;
  const liabilityPercent = totalValue > 0 ? (totalLiabilities / totalValue) * 100 : 0;
  const isPositiveNetWorth = totalStartingBalance >= 0;
  const targetProgress =
    projectedNetWorthAtTargetAge > 0
      ? Math.min(100, (totalStartingBalance / projectedNetWorthAtTargetAge) * 100)
      : 0;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Current Snapshot</h2>
      <Card className="bg-muted/50">
        <CardContent className="space-y-6 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Income
              </p>
              <p className="text-lg font-semibold">
                {fc(monthlyIncome)}{' '}
                <span className="text-muted-foreground text-xs font-normal">per month</span>
              </p>
              <p className="text-muted-foreground text-xs">({fc(snapshot.grossIncome)} per year)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Expenses
              </p>
              <p className="text-lg font-semibold">
                {fc(snapshot.monthlyExpenses)}{' '}
                <span className="text-muted-foreground text-xs font-normal">per month</span>
              </p>
              <p className="text-muted-foreground text-xs">
                ({fc(snapshot.annualSpend)} per year)
              </p>
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
                ({fc(yearlySavingsPlanned)} per year · {currentSavingsRate.toFixed(1)}% rate)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Emergency Fund
              </p>
              <p className="text-lg font-semibold">{fc(snapshot.emergencyFundBalance)}</p>
              <p className="text-muted-foreground text-xs">
                {snapshot.monthlyExpenses > 0
                  ? `(${emergencyFundMonths.toFixed(1)} months of expenses)`
                  : '(set monthly expenses to measure coverage)'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Net Worth
              </p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  isPositiveNetWorth ? 'text-success' : 'text-destructive',
                )}
              >
                {isPositiveNetWorth ? '' : '-'}
                {fc(Math.abs(totalStartingBalance))}
              </p>
              <p className="text-muted-foreground text-xs">
                ({fc(totalAssets)} assets · {fc(totalLiabilities)} liabilities)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t pt-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Savings Breakdown
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Net income ({(snapshot.netIncomeFactor * 100).toFixed(0)}% of gross)
                  </span>
                  <span className="font-medium">{fc(snapshot.netIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Extra reserve</span>
                  <span>{fc(snapshot.annualExtraExpenseBuffer)}</span>
                </div>
                <div className="border-t pt-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-success">Yearly saving</span>
                    <span className="text-success">{fc(snapshot.yearlySavings)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Savings rate (of gross income)</span>
                  <span className="text-success font-medium">{savingsRateOfGross.toFixed(1)}%</span>
                </div>
                <Progress
                  value={savingsRateOfGross}
                  className="h-2 [&>[data-slot=progress-indicator]]:bg-success"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Net Worth Breakdown
              </p>
              {hasLiabilities ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-success font-medium">
                      Assets {fc(totalAssets)}
                    </span>
                    <span className="text-destructive font-medium">
                      Liabilities {fc(totalLiabilities)}
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

              {assetAccounts.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">Assets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {assetAccounts.map((a) => (
                      <Link
                        key={a.id}
                        href="/accounts"
                        className="bg-success/10 text-success hover:bg-success/20 rounded-md px-2 py-0.5 text-xs transition-colors"
                      >
                        {a.name} ({fc(a.balance)})
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {liabilityAccounts.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">Liabilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {liabilityAccounts.map((a) => (
                      <Link
                        key={a.id}
                        href="/accounts"
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md px-2 py-0.5 text-xs transition-colors"
                      >
                        {a.name} ({fc(a.balance)})
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Progress to target at age {targetAge}
                  </span>
                  <span className="font-medium">
                    {fc(totalStartingBalance)} / {fc(projectedNetWorthAtTargetAge)}
                  </span>
                </div>
                <Progress
                  value={targetProgress}
                  className="h-2 [&>[data-slot=progress-indicator]]:bg-info"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
