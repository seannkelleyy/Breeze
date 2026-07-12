import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FinancialMathSnapshot } from '../../types/finance';

interface ExpensesEmergencyFundCardProps {
  snapshot: FinancialMathSnapshot;
  formatCurrency: (value: number) => string;
}

const fundTiers = [
  { label: '3 months', key: 'emergencyFund3Months' as const, months: 3 },
  { label: '6 months', key: 'emergencyFund6Months' as const, months: 6 },
  { label: '12 months', key: 'emergencyFund12Months' as const, months: 12 },
];

const ExpensesEmergencyFundCard = ({
  snapshot,
  formatCurrency,
}: ExpensesEmergencyFundCardProps) => {
  const efBalance = snapshot.emergencyFundBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Financial Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">{formatCurrency(snapshot.monthlyExpenses)}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Monthly expenses</p>
        </div>

        <div>
          <p className="text-lg font-semibold">{formatCurrency(efBalance)}</p>
          <p className="text-muted-foreground text-xs">Emergency fund balance</p>
        </div>

        <div className="space-y-3">
          {fundTiers.map((tier) => {
            const target = snapshot[tier.key];
            const pct = target > 0 ? Math.min(100, (efBalance / target) * 100) : 0;
            const isCovered = efBalance >= target;
            return (
              <div key={tier.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{tier.label}</span>
                  <span
                    className={cn(
                      'font-medium',
                      isCovered
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatCurrency(efBalance)} / {formatCurrency(target)}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={cn(
                    'h-2.5',
                    isCovered
                      ? '[&>[data-slot=progress-indicator]]:bg-green-500'
                      : pct >= 50
                        ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
                        : '[&>[data-slot=progress-indicator]]:bg-red-500',
                  )}
                />
                <p
                  className={cn(
                    'text-xs',
                    isCovered
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {isCovered
                    ? `${formatCurrency(efBalance - target)} above ${tier.label}`
                    : `${formatCurrency(target - efBalance)} short of ${tier.label}`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesEmergencyFundCard;
