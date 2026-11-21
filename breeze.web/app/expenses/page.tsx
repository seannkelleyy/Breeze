'use client';
import { Receipt } from 'lucide-react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { RequireAuth } from '@/components/common/auth/RequireAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { useRecurringExpenseManager } from '@/features/recurring/hooks/useRecurringExpenseManager';
import { ExpensesSummaryCard } from '@/features/recurring/components/ExpensesSummaryCard';
import { TransactionsCard } from '@/features/expenses/components/TransactionsCard';
import { RecurringExpenseList } from '@/features/recurring/components/RecurringExpenseList';

export default function ExpensesPage() {
  return (
    <RequireAuth>
      <ExpensesContent />
    </RequireAuth>
  );
}

function ExpensesContent() {
  const { currencyCode } = useCurrentUser();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } =
    useRecurringExpenseManager();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={Receipt}
        title="Monthly Expenses"
        subtitle="Fixed bills and flexible categories — what you expect to spend each month."
      />

      {isLoading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
      ) : (
        <>
          <ExpensesSummaryCard templates={templates} currencyCode={currencyCode} />
          <TransactionsCard currencyCode={currencyCode} />
          <RecurringExpenseList
            templates={templates}
            currencyCode={currencyCode}
            onCreate={createTemplate}
            onUpdate={updateTemplate}
            onDelete={deleteTemplate}
          />
        </>
      )}
    </div>
  );
}
