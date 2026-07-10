'use client';
import React, { useCallback, useEffect, useState } from 'react';

import { useBudgetContext } from '../../providers';
import { BreezeDialog } from '../../../../components/common/dialog/BreezeDialog';
import {
  RecurringCategoryTemplate,
  RecurringIncomeTemplate,
  useRecurringTemplates,
} from '../../hooks/recurring/recurringTemplateServices';
import { Button } from '@/components/ui/button';
import { RecurringIncomeSection, validateIncomeTemplate } from './RecurringIncomeSection';
import { RecurringCategorySection, validateCategoryTemplate } from './RecurringCategorySection';

type IncomeDraft =
  | RecurringIncomeTemplate
  | Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export const RecurringTemplatesDialog = () => {
  const {
    getRecurringIncomeTemplates,
    postRecurringIncomeTemplate,
    patchRecurringIncomeTemplate,
    deleteRecurringIncomeTemplate,
    getRecurringCategoryTemplates,
    postRecurringCategoryTemplate,
    patchRecurringCategoryTemplate,
    deleteRecurringCategoryTemplate,
  } = useRecurringTemplates();
  const { refetchBudget, refetchIncomes, refetchCategories, budget } = useBudgetContext();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  const [incomeTemplates, setIncomeTemplates] = useState<IncomeDraft[]>([]);
  const [categoryTemplates, setCategoryTemplates] = useState<RecurringCategoryTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    if (!budget?.id) return;
    setLoading(true);
    setError('');
    const budgetMonth = budget.date ? budget.date.slice(0, 7) + '-01' : undefined;
    try {
      const [incomeData, categoryData] = await Promise.all([
        getRecurringIncomeTemplates(),
        getRecurringCategoryTemplates(budget.id, budgetMonth),
      ]);
      setIncomeTemplates(incomeData);
      setCategoryTemplates(categoryData);
    } catch {
      setError('Failed to load recurring templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getRecurringCategoryTemplates, getRecurringIncomeTemplates, budget?.id]);

  useEffect(() => {
    if (open) {
      setAttemptedSave(false);
      void loadTemplates();
    }
  }, [open, loadTemplates]);

  const refreshBudgetViews = async () => {
    await Promise.all([refetchBudget(), refetchIncomes(), refetchCategories()]);
  };

  const handleDeleteIncome = async (template: IncomeDraft, index: number) => {
    const templateId = 'id' in template ? template.id : null;
    if (!templateId) {
      setIncomeTemplates((current) => current.filter((_, i) => i !== index));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await deleteRecurringIncomeTemplate(templateId);
      setIncomeTemplates((current) => current.filter((_, i) => i !== index));
      await refreshBudgetViews();
    } catch {
      setError('Failed to delete recurring income template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (template: RecurringCategoryTemplate, index: number) => {
    if (!template.id) {
      setCategoryTemplates((current) => current.filter((_, i) => i !== index));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await deleteRecurringCategoryTemplate(template.id);
      setCategoryTemplates((current) => current.filter((_, i) => i !== index));
      await refreshBudgetViews();
    } catch {
      setError('Failed to delete recurring category template.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setAttemptedSave(true);
    setError('');

    const hasIncomeErrors = incomeTemplates.some(
      (t) => Object.keys(validateIncomeTemplate(t)).length > 0,
    );
    const hasCategoryErrors = categoryTemplates.some(
      (t) => Object.keys(validateCategoryTemplate(t)).length > 0,
    );
    if (hasIncomeErrors || hasCategoryErrors) {
      setError('Please fix validation issues before saving.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        ...incomeTemplates.map((template) =>
          'id' in template && template.id
            ? patchRecurringIncomeTemplate(template as RecurringIncomeTemplate)
            : postRecurringIncomeTemplate(
                template as Omit<
                  RecurringIncomeTemplate,
                  'id' | 'userId' | 'createdAt' | 'updatedAt'
                >,
              ),
        ),
        ...categoryTemplates.map((template) =>
          template.id
            ? patchRecurringCategoryTemplate(template)
            : postRecurringCategoryTemplate(template, budget?.id ?? ''),
        ),
      ]);
      await loadTemplates();
      await refreshBudgetViews();
    } catch {
      setError('Failed to save recurring templates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BreezeDialog
      dialogTrigger={<Button variant="outline">Manage Recurring Templates</Button>}
      title="Recurring Templates"
      description="Define repeating incomes and category allocations that auto-populate each month."
      open={open}
      onOpenChange={setOpen}
      dialogContentClassName="!w-[98vw] sm:!w-[96vw] lg:!w-[94vw] !max-w-[1260px]"
    >
      <div className="grid gap-6 pb-2">
        {error ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading recurring templates...</p>
        ) : null}

        <RecurringIncomeSection
          templates={incomeTemplates}
          attemptedSave={attemptedSave}
          saving={saving}
          today={today}
          onUpdate={setIncomeTemplates}
          onDelete={handleDeleteIncome}
        />

        <RecurringCategorySection
          templates={categoryTemplates}
          attemptedSave={attemptedSave}
          saving={saving}
          today={today}
          onUpdate={setCategoryTemplates}
          onDelete={handleDeleteCategory}
        />

        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-20 flex justify-end rounded-md border p-3 backdrop-blur">
          <Button type="button" disabled={saving || loading} onClick={() => void handleSaveAll()}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </BreezeDialog>
  );
};

export default RecurringTemplatesDialog;
