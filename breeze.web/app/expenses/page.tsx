'use client';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { PageHeader } from '@/components/common/PageHeader';
import {
  useRecurringTemplates,
  RecurringExpenseTemplate,
} from '@/app/budget/hooks/recurring/recurringTemplateServices';
import { useRegenerateBudget } from '@/app/budget/hooks/budget/useRegenerateBudget';
import { ExpensesSummaryCard } from './components/ExpensesSummaryCard';
import { TransactionsCard } from './components/TransactionsCard';
import { RecurringExpenseList } from './components/RecurringExpenseList';

export default function ExpensesPage() {
  const { userId, isLoaded, currencyCode } = useCurrentUser();
  const {
    getRecurringExpenseTemplates,
    postRecurringExpenseTemplate,
    patchRecurringExpenseTemplate,
    deleteRecurringExpenseTemplate,
  } = useRecurringTemplates();

  const [templates, setTemplates] = useState<RecurringExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getRecurringExpenseTemplates();
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  }, [userId, getRecurringExpenseTemplates]);

  useEffect(() => {
    if (isLoaded && userId) load();
  }, [isLoaded, userId, load]);

  // Template changes flow into the current month's budget: the server
  // regenerates that month's categories/expenses from these templates.
  const { regenerateBudgetMonth } = useRegenerateBudget();
  const queryClient = useQueryClient();
  const syncCurrentMonthBudget = useCallback(async () => {
    const now = new Date();
    try {
      await regenerateBudgetMonth(now.getFullYear(), now.getMonth() + 1);
      await queryClient.invalidateQueries({ queryKey: ['budget'] });
    } catch {
      // Budget sync is best-effort; the budget page's Regenerate covers the rest.
    }
  }, [regenerateBudgetMonth, queryClient]);

  const handleCreate = useCallback(
    async (
      template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    ) => {
      const created = await postRecurringExpenseTemplate(template);
      setTemplates((prev) => [created, ...prev]);
      await syncCurrentMonthBudget();
    },
    [postRecurringExpenseTemplate, syncCurrentMonthBudget],
  );

  const handleUpdate = useCallback(
    async (template: RecurringExpenseTemplate) => {
      const updated = await patchRecurringExpenseTemplate(template);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      await syncCurrentMonthBudget();
    },
    [patchRecurringExpenseTemplate, syncCurrentMonthBudget],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRecurringExpenseTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      await syncCurrentMonthBudget();
    },
    [deleteRecurringExpenseTemplate, syncCurrentMonthBudget],
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={Receipt}
        title="Monthly Expenses"
        subtitle="Fixed bills and flexible categories — what you expect to spend each month."
      />

      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
      ) : (
        <>
          <ExpensesSummaryCard templates={templates} currencyCode={currencyCode} />
          <TransactionsCard userId={userId} currencyCode={currencyCode} />
          <RecurringExpenseList
            templates={templates}
            currencyCode={currencyCode}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}
