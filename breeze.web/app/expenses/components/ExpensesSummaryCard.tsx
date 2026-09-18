'use client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecurringExpenseTemplate } from '@/app/budget/hooks/recurring/recurringTemplateServices';
import { formatCurrencyWithCode } from '@/lib/utils';

interface ExpensesSummaryCardProps {
  templates: RecurringExpenseTemplate[];
  currencyCode: string;
}

function monthlyAmount(template: RecurringExpenseTemplate): number {
  const amount = Number(template.amount) || 0;
  switch (template.recurrenceInterval) {
    case 'WEEKLY':
      return (amount * 52) / 12;
    case 'BIWEEKLY':
      return (amount * 26) / 12;
    case 'QUARTERLY':
      return amount / 3;
    case 'YEARLY':
      return amount / 12;
    default:
      return amount;
  }
}

export function ExpensesSummaryCard({ templates, currencyCode }: ExpensesSummaryCardProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const totalMonthly = templates.reduce((sum, t) => sum + monthlyAmount(t), 0);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-muted-foreground text-xs">Monthly Total</CardDescription>
          <CardTitle className="text-2xl">{fc(totalMonthly)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-muted-foreground text-xs">Yearly Total</CardDescription>
          <CardTitle className="text-2xl">{fc(totalYearly)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-muted-foreground text-xs">
            Active Subscriptions
          </CardDescription>
          <CardTitle className="text-2xl">{templates.length}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
