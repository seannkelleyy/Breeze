'use client';
import { useCallback, useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { PageHeader } from '@/components/common/PageHeader';
import {
  useRecurringTemplates,
  RecurringExpenseTemplate,
} from '@/app/budget/hooks/recurring/recurringTemplateServices';
import { ExpensesSummaryCard } from './components/ExpensesSummaryCard';
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

  const handleCreate = useCallback(
    async (
      template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    ) => {
      const created = await postRecurringExpenseTemplate(template);
      setTemplates((prev) => [created, ...prev]);
    },
    [postRecurringExpenseTemplate],
  );

  const handleUpdate = useCallback(
    async (template: RecurringExpenseTemplate) => {
      const updated = await patchRecurringExpenseTemplate(template);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [patchRecurringExpenseTemplate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRecurringExpenseTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    },
    [deleteRecurringExpenseTemplate],
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader icon={Receipt} title="Expenses" subtitle="Recurring bills and subscriptions." />

      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
      ) : (
        <>
          <ExpensesSummaryCard templates={templates} currencyCode={currencyCode} />
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
