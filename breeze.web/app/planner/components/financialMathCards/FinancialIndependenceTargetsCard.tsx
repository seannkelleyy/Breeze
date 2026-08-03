import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialMathSnapshot } from '../../types/finance';

interface FinancialIndependenceTargetsCardProps {
  snapshot: FinancialMathSnapshot;
  formatCurrency: (value: number) => string;
}

const FinancialIndependenceTargetsCard = ({
  snapshot,
  formatCurrency,
}: FinancialIndependenceTargetsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Independence Targets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Safe withdrawal rate: {snapshot.safeWithdrawalRatePercent.toFixed(2)}% (x
          {snapshot.withdrawalMultiplier.toFixed(2)} annual-spend multiplier)
        </p>
        <p>Current portfolio base: {formatCurrency(snapshot.currentPortfolio)}</p>
        <p>Current portfolio yearly income: {formatCurrency(snapshot.yearlyPortfolioIncome)}</p>
        <div className="space-y-2 pt-1">
          {snapshot.scenarios.map((scenario) => {
            return (
              <div key={scenario.label} className="rounded-md border p-2">
                <p className="font-medium">{scenario.label}</p>
                <p>Yearly spend: {formatCurrency(scenario.yearlySpend)}</p>
                <p>FI target: {formatCurrency(scenario.targetAmount)}</p>
                <p>Percent to goal: {scenario.percentToGoal.toFixed(2)}%</p>
                <p>
                  Years until goal @ {snapshot.yearsToGoalRatePercent}%:{' '}
                  {scenario.yearsUntilGoal === null
                    ? 'Needs positive yearly savings to estimate'
                    : scenario.yearsUntilGoal.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialIndependenceTargetsCard;
