'use client';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../components/common/form/BreezeFormDialog';

import { BudgetExpenseItem } from './BudgetExpenseItem';
import { BudgetIncomeItem } from './BudgetIncomeItem';
import { useBudgets } from '../../hooks/budget/index';
import {
  useCategories,
  useDeleteCategory,
  usePatchCategory,
  usePostCategory,
} from '../../hooks/category/index';
import {
  useDeleteIncome,
  useIncomes,
  usePatchIncome,
  usePostIncome,
} from '../../hooks/income/index';
import { BudgetFormData, budgetFormSchema } from '../../types/budget';
import { useBudgetContext } from '../../providers/index';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isMoneyGreaterThanOrEqualWithTolerance } from '@/app/planner/lib/constants';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

/**
 * A Dialog that allows users to view and edit their budget, including incomes and expense categories.
 * @returns {JSX.Element} The BudgetDialog component.
 */
export const BudgetDialog = () => {
  const { userId } = useCurrentUser();
  const { budget, categories, incomes, refetchCategories, refetchBudget, refetchIncomes } =
    useBudgetContext();
  const { getBudget } = useBudgets();
  const { getCategories } = useCategories();
  const { getIncomes } = useIncomes();
  const [open, setOpen] = useState(false);
  const [autoSeedMessage, setAutoSeedMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    mode: 'onChange',
    defaultValues: {
      incomes: (incomes ?? [])
        .filter((income) => income.sourceType !== 'recurring-template')
        .map(({ id, name, budgetId, amount, date, recurrenceInterval, paydayDayOfMonth }) => ({
          id,
          name,
          budgetId,
          amount,
          date,
          recurrenceInterval: recurrenceInterval ?? 'none',
          paydayDayOfMonth: paydayDayOfMonth ?? new Date(date).getDate(),
        })),
      categories: (categories ?? [])
        .filter((category) => category.sourceType !== 'recurring-template')
        .map(({ id, name, budgetId, currentSpend, allocation }) => ({
          id,
          name,
          budgetId,
          currentSpend,
          allocation,
        })),
    },
  });

  const postCategoryMutation = usePostCategory({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
    },
  });
  const patchCategoryMutation = usePatchCategory({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
    },
  });
  const deleteCategoryMutation = useDeleteCategory({
    onSettled: () => refetchCategories(),
  });

  const postIncomeMutation = usePostIncome({
    onSettled: () => {
      refetchBudget();
      refetchIncomes();
    },
  });
  const patchIncomeMutation = usePatchIncome({
    onSettled: () => {
      refetchBudget();
      refetchIncomes();
    },
  });
  const deleteIncomeMutation = useDeleteIncome({
    onSettled: () => refetchIncomes(),
  });

  const handleDeleteCategory = (index: number) => {
    const category = form.getValues().categories[index];
    if (category.id !== -1) {
      deleteCategoryMutation.mutate({
        category: { ...category, userId, budgetId: budget.id },
      });
    }
    form.setValue(
      'categories',
      form.getValues().categories.filter((_, i) => i !== index),
    );
  };

  const handleDeleteIncome = (index: number) => {
    const income = form.getValues().incomes[index];
    if (income.id !== -1) {
      deleteIncomeMutation.mutate({
        income: { ...income, userId, budgetId: budget.id },
      });
    }
    form.setValue(
      'incomes',
      form.getValues().incomes.filter((_, i) => i !== index),
    );
  };

  const onSubmit = (values: BudgetFormData) => {
    if (!userId || !budget?.id) return;
    values.categories.forEach((category) => {
      const payload = { ...category, userId, budgetId: budget.id };
      if (category.id && category.id !== -1) {
        patchCategoryMutation.mutate({ category: payload });
      } else if (category.name.trim() && category.allocation > 0) {
        postCategoryMutation.mutate({ category: payload });
      }
    });
    values.incomes.forEach((income) => {
      const fallbackPayday = new Date(income.date).getDate();
      const normalizedMonthlyPayday =
        typeof income.paydayDayOfMonth === 'number' &&
        income.paydayDayOfMonth >= 1 &&
        income.paydayDayOfMonth <= 31
          ? income.paydayDayOfMonth
          : fallbackPayday;

      const payload = {
        ...income,
        userId,
        budgetId: budget.id,
        isRecurring: income.recurrenceInterval !== 'none',
        paydayDayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(
          income.recurrenceInterval ?? 'none',
        )
          ? normalizedMonthlyPayday
          : null,
      };
      if (income.id && income.id !== -1) {
        patchIncomeMutation.mutate({ income: payload });
      } else if (income.name.trim() && income.amount > 0) {
        postIncomeMutation.mutate({ budgetId: budget.id, income: payload });
      }
    });
    setOpen(false);
  };

  const seedFromPreviousMonth = async (force = false) => {
    if (!budget?.id || !budget?.date) {
      return;
    }

    const hasCurrentData = incomes.length > 0 || categories.length > 0;
    if (hasCurrentData && !force) {
      return;
    }

    setIsSeeding(true);

    const previousMonth = dayjs(budget.date).subtract(1, 'month');
    const previousBudget = await getBudget(previousMonth.year(), previousMonth.month() + 1);
    if (!previousBudget?.id) {
      setAutoSeedMessage('No previous month budget found to seed from.');
      setIsSeeding(false);
      return;
    }

    const [previousIncomes, previousCategories] = await Promise.all([
      getIncomes(previousBudget.id),
      getCategories(previousBudget.id),
    ]);

    const seededIncomes = previousIncomes
      .filter((income) => (income.recurrenceInterval ?? 'none') !== 'none')
      .map((income) => ({
        id: -1,
        userId,
        budgetId: budget.id,
        name: income.name,
        amount: income.amount,
        date: income.date,
        recurrenceInterval: income.recurrenceInterval ?? 'monthly',
        paydayDayOfMonth: income.paydayDayOfMonth ?? new Date(income.date).getDate(),
      }));

    const seededCategories = previousCategories.map((category) => ({
      id: -1,
      userId,
      name: category.name,
      budgetId: budget.id,
      currentSpend: 0,
      allocation: category.allocation,
    }));

    if (seededIncomes.length === 0 && seededCategories.length === 0) {
      setAutoSeedMessage(
        'Previous month has no recurring incomes or category allocations to seed.',
      );
      setIsSeeding(false);
      return;
    }

    form.reset({
      incomes: seededIncomes,
      categories: seededCategories,
    });
    setAutoSeedMessage(
      'Auto-filled recurring incomes and last month expense categories. Save to persist.',
    );
    setIsSeeding(false);
  };

  const editableIncomeTotal = form
    .watch('incomes')
    .reduce((sum, income) => sum + (Number(income.amount) || 0), 0);
  const templateIncomeTotal = (incomes ?? [])
    .filter((income) => income.sourceType === 'recurring-template')
    .reduce((sum, income) => sum + (Number(income.amount) || 0), 0);
  const totalIncome = editableIncomeTotal + templateIncomeTotal;

  const editableExpenseTotal = form
    .watch('categories')
    .reduce((sum, category) => sum + (Number(category.allocation) || 0), 0);
  const templateExpenseTotal = (categories ?? [])
    .filter((category) => category.sourceType === 'recurring-template')
    .reduce((sum, category) => sum + (Number(category.allocation) || 0), 0);
  const totalExpenses = editableExpenseTotal + templateExpenseTotal;
  const totalBudgetDifference = totalIncome - totalExpenses;
  const isTotalBudgetDifferencePositive = isMoneyGreaterThanOrEqualWithTolerance(
    totalBudgetDifference,
    0,
  );

  useEffect(() => {
    if (!open) {
      setAutoSeedMessage('');
      return;
    }

    if (incomes.length > 0 || categories.length > 0) {
      form.reset({
        incomes: incomes
          .filter((income) => income.sourceType !== 'recurring-template')
          .map((i) => ({
            ...i,
            recurrenceInterval: i.recurrenceInterval ?? 'none',
            paydayDayOfMonth: i.paydayDayOfMonth ?? new Date(i.date).getDate(),
          })),
        categories: categories
          .filter((category) => category.sourceType !== 'recurring-template')
          .map((c) => ({ ...c })),
      });
      return;
    }

    void seedFromPreviousMonth();
  }, [open, incomes, categories, form, budget?.id, budget?.date]);

  const inputFields = (
    <>
      {(incomes ?? []).some((income) => income.sourceType === 'recurring-template') ||
      (categories ?? []).some((category) => category.sourceType === 'recurring-template') ? (
        <div className="border-primary/30 bg-primary/5 text-foreground/90 rounded-lg border px-3 py-2 text-sm">
          Some rows are generated from recurring templates and are managed in "Manage Recurring
          Templates".
        </div>
      ) : null}
      <div className="bg-muted/20 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-foreground/80 max-w-2xl text-sm leading-relaxed">
          {autoSeedMessage ||
            'Use re-seed to pull recurring incomes and expense allocations from last month.'}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isSeeding || !budget?.id}
          onClick={() => void seedFromPreviousMonth(true)}
          className="w-full sm:w-auto"
        >
          {isSeeding ? 'Seeding...' : 'Re-seed From Previous Month'}
        </Button>
      </div>
      <section className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-3">
        <div className="bg-background/70 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Income</p>
          <p className="mt-1 text-2xl font-semibold">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-background/70 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Expenses</p>
          <p className="mt-1 text-2xl font-semibold">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-background/70 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Budget Difference</p>
          <p
            className={`mt-1 text-2xl font-semibold ${isTotalBudgetDifferencePositive ? 'text-green-600' : 'text-destructive'}`}
          >
            ${totalBudgetDifference.toFixed(2)}
          </p>
        </div>
      </section>
      <section className="bg-muted/10 mt-2 grid gap-4 rounded-lg border p-4 py-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Estimated Incomes</h2>
          <p className="text-foreground/70 text-sm">Recurring pay schedules</p>
        </div>
        {(incomes ?? []).filter((i) => i.sourceType === 'recurring-template').length > 0 ? (
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">From Templates</p>
            {(incomes ?? [])
              .filter((i) => i.sourceType === 'recurring-template')
              .map((income) => (
                <div
                  key={income.id}
                  className="bg-background/60 text-muted-foreground flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{income.name}</span>
                  <span>${income.amount}</span>
                </div>
              ))}
          </div>
        ) : null}
        {form.watch('incomes').map((_, index) => (
          <BudgetIncomeItem
            key={index}
            index={index}
            form={form}
            deleteIncome={handleDeleteIncome}
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            form.setValue(
              'incomes',
              [
                ...form.getValues().incomes,
                {
                  userId,
                  budgetId: budget.id,
                  name: '',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  recurrenceInterval: 'none',
                  paydayDayOfMonth: new Date().getDate(),
                },
              ],
              { shouldValidate: false },
            );
          }}
        >
          Add Income
        </Button>
      </section>
      <section className="bg-muted/10 mt-2 grid gap-4 rounded-lg border p-4 py-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Estimated Expenses</h2>
          <p className="text-foreground/70 text-sm">Monthly category allocations</p>
        </div>
        {(categories ?? []).filter((c) => c.sourceType === 'recurring-template').length > 0 ? (
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">From Templates</p>
            {(categories ?? [])
              .filter((c) => c.sourceType === 'recurring-template')
              .map((category) => (
                <div
                  key={category.id}
                  className="bg-background/60 text-muted-foreground flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{category.name}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(category.allocation)}
                  </span>
                </div>
              ))}
          </div>
        ) : null}
        {form.watch('categories').map((_, index) => (
          <BudgetExpenseItem
            key={index}
            index={index}
            form={form}
            deleteCategory={handleDeleteCategory}
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            form.setValue(
              'categories',
              [
                ...form.getValues().categories,
                {
                  userId,
                  name: '',
                  budgetId: budget.id,
                  currentSpend: 0,
                  allocation: 0,
                },
              ],
              {
                shouldValidate: false,
              },
            );
          }}
        >
          Add Expense
        </Button>
      </section>
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={<Button onClick={() => setOpen(true)}>Edit Budget</Button>}
      title="Edit Budget"
      itemType="Budget"
      description="Add and edit your estimated incomes and expenses."
      dialogContentClassName="!w-[98vw] sm:!w-[96vw] lg:!w-[94vw] !max-w-[1320px]"
      footerClassName="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t pt-3 flex flex-row gap-2 items-center justify-center w-full"
      disableSubmitUntilValid={false}
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
    />
  );
};
