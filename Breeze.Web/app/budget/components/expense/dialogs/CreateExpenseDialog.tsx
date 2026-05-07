'use client';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { useBudgetContext } from '@/app/budget/providers/index';
import { usePostExpense } from '@/app/budget/hooks/expense/index';
import { Expense, expenseFormSchema } from '@/app/budget/types/expense';
import { FormSelectField } from '@/components/common/form/FormSelectField';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

/**
 * @returns {JSX.Element} The CreateExpenseDialog component.
 */
export const CreateExpenseDialog = () => {
  const { userId } = useCurrentUser();
  const { budget, categories, refetchBudget, refetchCategories, refetchExpenses } =
    useBudgetContext();

  const form = useForm<Expense>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      userId,
      categoryId: categories?.[0]?.id ?? 1,
      name: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const nextCategoryId = categories[0]?.id ?? 1;
    if (budget?.id && form.getValues('categoryId') !== nextCategoryId) {
      form.setValue('categoryId', nextCategoryId);
    }
  }, [form, categories, budget?.id]);

  const postMutation = usePostExpense({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
      refetchExpenses();
    },
  });

  const onSubmit = (values: Expense) => {
    if (!userId || !budget?.id) return;
    postMutation.mutate({
      budgetId: budget.id,
      expense: {
        ...values,
        userId,
        recurrenceInterval: 'none',
        dueDayOfMonth: null,
      },
    });
  };

  const dialogTrigger = <Button>Add Expense</Button>;

  const inputFields = (
    <>
      <FormInputField form={form} name="name" label="Name" placeholder="e.g., Groceries" />
      <FormSelectField
        form={form}
        name="categoryId"
        label="Category"
        placeholder="Select a category"
        options={
          categories?.map((c) => ({
            value: String(c.id),
            label: c.name,
          })) ?? []
        }
      />
      <FormInputField form={form} name="amount" label="Amount" type="number" placeholder="0.00" />
      <FormInputField form={form} name="date" label="Date" type="date" />
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Create Expense"
      itemType="Expense"
      description="Add a new expense entry. Click save when you're done."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
    />
  );
};
