import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialMathSnapshot } from '../../types/finance';

type IncomeSavingsCardProps = {
  snapshot: FinancialMathSnapshot;
  formatCurrency: (value: number) => string;
};

const IncomeSavingsCard = ({ snapshot, formatCurrency }: IncomeSavingsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income + Savings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>Self salary: {formatCurrency(snapshot.selfSalary)}</p>
        <p>Spouse salary: {formatCurrency(snapshot.spouseSalary)}</p>
        <p>Gross income: {formatCurrency(snapshot.grossIncome)}</p>
        <p>
          Net income ({(snapshot.netIncomeFactor * 100).toFixed(0)}%):{' '}
          {formatCurrency(snapshot.netIncome)}
        </p>
        <p>Annual spend: {formatCurrency(snapshot.annualSpend)}</p>
        <p>Annual extra reserve: {formatCurrency(snapshot.annualExtraExpenseBuffer)}</p>
        <p>Yearly saving: {formatCurrency(snapshot.yearlySavings)}</p>
      </CardContent>
    </Card>
  );
};

export default IncomeSavingsCard;
