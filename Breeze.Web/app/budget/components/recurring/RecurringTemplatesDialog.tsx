'use client';
import React, { useCallback, useEffect, useState } from 'react';

import { useBudgetContext } from '../../providers';
import { BreezeDialog } from '../../../../components/common/dialog/BreezeDialog';
import {
  RecurringExpenseTemplate,
  RecurringIncomeTemplate,
  useRecurringTemplates,
} from '../../hooks/recurring/recurringTemplateServices';
import { Button } from '@/components/ui/button';
import { RecurringIncomeSection, validateIncomeTemplate } from './RecurringIncomeSection';
import {
  RecurringCategorySection,
  makeDefaultRecurringExpenseTemplate,
  validateRecurringExpenseTemplate,
} from './RecurringCategorySection';

type IncomeDraft =
  | RecurringIncomeTemplate
  | Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

type ExpenseDraft = Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export const RecurringTemplatesDialog = () => {
  const {
    getRecurringIncomeTemplates,
    postRecurringIncomeTemplate,
    patchRecurringIncomeTemplate,
    deleteRecurringIncomeTemplate,
    getRecurringExpenseTemplates,
    postRecurringExpenseTemplate,
    deleteRecurringExpenseTemplate,
  } = useRecurringTemplates();
  const { refetchBudget, refetchIncomes, refetchCategories, refetchExpenses } = useBudgetContext();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  const [incomeTemplates, setIncomeTemplates] = useState<IncomeDraft[]>([]);
  const [expenseTemplates, setExpenseTemplates] = useState<RecurringExpenseTemplate[]>([]);
  const [newExpenseTemplates, setNewExpenseTemplates] = useState<ExpenseDraft[]>([]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [incomeData, expenseData] = await Promise.all([
        getRecurringIncomeTemplates(),
        getRecurringExpenseTemplates(),
      ]);
      setIncomeTemplates(incomeData);
      setExpenseTemplates(expenseData);
      setNewExpenseTemplates([]);
    } catch {
      setError('Failed to load recurring templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getRecurringIncomeTemplates, getRecurringExpenseTemplates]);

  useEffect(() => {
    if (open) {
      setAttemptedSave(false);
      void loadTemplates();
    }
  }, [open, loadTemplates]);

  const refreshBudgetViews = async () => {
    await Promise.all([refetchBudget(), refetchIncomes(), refetchCategories(), refetchExpenses()]);
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

  const handleDeleteExpense = async (template: RecurringExpenseTemplate) => {
    setSaving(true);
    setError('');
    try {
      await deleteRecurringExpenseTemplate(template.id);
      setExpenseTemplates((current) => current.filter((t) => t.id !== template.id));
      await refreshBudgetViews();
    } catch {
      setError('Failed to delete recurring expense template.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveNewExpense = (index: number) => {
    setNewExpenseTemplates((current) => current.filter((_, i) => i !== index));
  };

  const handleUpdateNewExpense = (index: number, updater: (prev: ExpenseDraft) => ExpenseDraft) => {
    setNewExpenseTemplates((current) =>
      current.map((item, i) => (i === index ? updater(item) : item)),
    );
  };

  const handleAddNewExpense = () => {
    setNewExpenseTemplates((current) => [...current, makeDefaultRecurringExpenseTemplate(today)]);
  };

  const handleSaveAll = async () => {
    setAttemptedSave(true);
    setError('');

    const hasIncomeErrors = incomeTemplates.some(
      (t) => Object.keys(validateIncomeTemplate(t)).length > 0,
    );
    const hasExpenseErrors = newExpenseTemplates.some(
      (t) => Object.keys(validateRecurringExpenseTemplate(t)).length > 0,
    );
    if (hasIncomeErrors || hasExpenseErrors) {
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
        ...newExpenseTemplates.map((template) => postRecurringExpenseTemplate(template)),
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
      description="Define repeating incomes and expenses that auto-populate each month."
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
          templates={expenseTemplates}
          newTemplates={newExpenseTemplates}
          attemptedSave={attemptedSave}
          saving={saving}
          onAddNew={handleAddNewExpense}
          onRemoveNew={handleRemoveNewExpense}
          onUpdateNew={handleUpdateNewExpense}
          onDeleteExisting={handleDeleteExpense}
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
