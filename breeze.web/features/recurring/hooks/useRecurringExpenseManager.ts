'use client';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { useRegenerateBudget } from '@/features/budget/hooks/useRegenerateBudget';
import {
  useRecurringTemplates,
  type RecurringExpenseTemplate,
} from '@/features/recurring/hooks/recurringTemplateServices';

export type NewRecurringExpenseTemplate = Omit<
  RecurringExpenseTemplate,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

/**
 * Owns the recurring-expense template list and keeps the current month's
 * budget in sync after any change: the server regenerates that month's
 * categories/expenses from these templates.
 */
export function useRecurringExpenseManager() {
  const { userId, isLoaded } = useCurrentUser();
  const {
    getRecurringExpenseTemplates,
    postRecurringExpenseTemplate,
    patchRecurringExpenseTemplate,
    deleteRecurringExpenseTemplate,
  } = useRecurringTemplates();

  const [templates, setTemplates] = useState<RecurringExpenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Kept memoized: it is a dependency of the effect below, so a new identity
  // per render would re-run the effect and refetch endlessly.
  const load = useCallback(async () => {
    // loading starts true; the first setState lands after the await so the
    // initial fetch doesn't cascade renders from the mount effect.
    try {
      const data = await getRecurringExpenseTemplates();
      setTemplates(data);
    } finally {
      setIsLoading(false);
    }
  }, [getRecurringExpenseTemplates]);

  useEffect(() => {
    if (isLoaded && userId) load();
  }, [isLoaded, userId, load]);

  const { regenerateBudgetMonth } = useRegenerateBudget();
  const queryClient = useQueryClient();

  const syncCurrentMonthBudget = async () => {
    const now = new Date();
    try {
      await regenerateBudgetMonth(now.getFullYear(), now.getMonth() + 1);
      await queryClient.invalidateQueries({ queryKey: ['budget'] });
    } catch {
      // Budget sync is best-effort; the budget page's Regenerate covers the rest.
    }
  };

  const createTemplate = async (template: NewRecurringExpenseTemplate) => {
    const created = await postRecurringExpenseTemplate(template);
    setTemplates((prev) => [created, ...prev]);
    await syncCurrentMonthBudget();
  };

  const updateTemplate = async (template: RecurringExpenseTemplate) => {
    const updated = await patchRecurringExpenseTemplate(template);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await syncCurrentMonthBudget();
  };

  const deleteTemplate = async (id: string) => {
    await deleteRecurringExpenseTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await syncCurrentMonthBudget();
  };

  return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate };
}
