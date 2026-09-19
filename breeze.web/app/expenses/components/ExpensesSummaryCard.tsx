'use client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RecurringExpenseTemplate,
  getRecurringExpensesMonthlyTotal,
} from '@/app/budget/hooks/recurring/recurringTemplateServices';
import { formatCurrencyWithCode } from '@/lib/utils';

interface ExpensesSummaryCardProps {
  templates: RecurringExpenseTemplate[];
  currencyCode: string;
}

export function ExpensesSummaryCard({ templates, currencyCode }: ExpensesSummaryCardProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const totalMonthly = getRecurringExpensesMonthlyTotal(templates);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    </div>
  );
}
