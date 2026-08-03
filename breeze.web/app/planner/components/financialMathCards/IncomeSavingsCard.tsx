import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FinancialMathSnapshot } from '../../types/finance';

type IncomeSavingsCardProps = {
  snapshot: FinancialMathSnapshot;
  formatCurrency: (value: number) => string;
};

const IncomeSavingsCard = ({ snapshot, formatCurrency }: IncomeSavingsCardProps) => {
  const savingsRate =
    snapshot.netIncome > 0 ? Math.min(100, (snapshot.yearlySavings / snapshot.netIncome) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income + Savings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Self salary</span>
            <span>{formatCurrency(snapshot.selfSalary)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spouse salary</span>
            <span>{formatCurrency(snapshot.spouseSalary)}</span>
          </div>
          <div className="border-t pt-1">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Gross income</span>
              <span>{formatCurrency(snapshot.grossIncome)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Net income ({(snapshot.netIncomeFactor * 100).toFixed(0)}%)
            </span>
            <span className="font-medium">{formatCurrency(snapshot.netIncome)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Annual spend</span>
            <span>{formatCurrency(snapshot.annualSpend)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Extra reserve</span>
            <span>{formatCurrency(snapshot.annualExtraExpenseBuffer)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-success">Yearly saving</span>
            <span className="text-success">
              {formatCurrency(snapshot.yearlySavings)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Savings rate</span>
            <span className="font-medium text-success">
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={savingsRate}
            className="h-2 [&>[data-slot=progress-indicator]]:bg-success"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeSavingsCard;
