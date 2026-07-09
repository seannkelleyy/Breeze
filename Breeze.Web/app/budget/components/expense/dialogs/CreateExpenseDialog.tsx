'use client';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { useBudgetContext } from '@/app/budget/providers/index';
import { usePostExpense } from '@/app/budget/hooks/expense/index';
import { Expense, ExpenseFormData, expenseFormSchema } from '@/app/budget/types/expense';
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

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      splits: [
        {
          categoryId: categories?.[0]?.id ?? '',
          amount: '',
        },
      ],
    },
  });

  useEffect(() => {
    const nextCategoryId = categories[0]?.id ?? '';
    if (nextCategoryId && form.getValues('splits.0.categoryId') !== nextCategoryId) {
      form.setValue('splits.0.categoryId', nextCategoryId);
    }
  }, [form, categories]);

  const postMutation = usePostExpense({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
      refetchExpenses();
    },
  });

  const onSubmit = async (values: ExpenseFormData) => {
    if (!userId || !budget?.id) return;
    const expense: Omit<Expense, 'id' | 'userId' | 'budgetId' | 'createdAt' | 'updatedAt'> = {
      amount: values.amount,
      date: values.date,
      description: values.description,
      splits: values.splits,
    };
    await postMutation.mutateAsync({
      budgetId: budget.id,
      userId,
      expense,
    });
  };

  const dialogTrigger = <Button>Add Expense</Button>;

  const inputFields = (
    <>
      <FormInputField
        form={form}
        name="description"
        label="Description"
        placeholder="e.g., Groceries"
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
