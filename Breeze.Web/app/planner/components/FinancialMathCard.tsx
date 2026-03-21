'use client';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyWithCode } from '../lib/plannerMath';
import { FinancialMathSnapshot } from '../types/finance';
import ExpensesEmergencyFundCard from './financialMathCards/ExpensesEmergencyFundCard';
import IncomeSavingsCard from './financialMathCards/IncomeSavingsCard';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

interface FinancialMathCardProps {
  snapshot: FinancialMathSnapshot;
}

const FinancialMathCard = ({ snapshot }: FinancialMathCardProps) => {
  const { currencyCode } = useCurrentUser();

  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>Emergency Fund + FI Math Snapshot</CardTitle>
        <CardDescription>
          This mirrors your Apple Notes formulas using your saved planner values, so it stays
          updated in one place.
        </CardDescription>
      </CardHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ExpensesEmergencyFundCard snapshot={snapshot} formatCurrency={formatCurrency} />
        <IncomeSavingsCard snapshot={snapshot} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
};

export default FinancialMathCard;
