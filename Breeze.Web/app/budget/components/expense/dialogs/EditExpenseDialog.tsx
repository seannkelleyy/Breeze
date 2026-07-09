'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useBudgetContext } from '../../../providers';
import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { useDeleteExpense, usePatchExpense } from '@/app/budget/hooks/expense/index';
import { Expense, ExpenseFormData, expenseFormSchema } from '@/app/budget/types/expense';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import DeleteDialog from '@/components/common/dialog/DeleteDialog';

type EditExpenseDialogProps = {
  existingExpense: Expense;
  children?: React.ReactNode;
};

/**
 * Dialog component for editing an existing expense.
 * @param {Expense} existingExpense - The expense to be edited.
 * @param {React.ReactNode} children - Optional trigger element for the dialog.
 * @returns {JSX.Element} The EditExpenseDialog component.
 */
export const EditExpenseDialog = ({ existingExpense, children }: EditExpenseDialogProps) => {
  const { userId } = useCurrentUser();
  const { budget, refetchBudget, refetchExpenses } = useBudgetContext();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: existingExpense.amount,
      date: existingExpense.date,
      description: existingExpense.description,
      splits: existingExpense.splits.map((s) => ({
        categoryId: s.categoryId,
        amount: s.amount,
        description: s.description,
      })),
    },
  });

  const patchMutation = usePatchExpense({
    onSettled: () => {
      refetchBudget();
      refetchExpenses();
    },
  });

  const deleteMutation = useDeleteExpense({
    onSettled: () => {
      refetchBudget();
      refetchExpenses();
    },
  });

  const onSubmit = async (values: ExpenseFormData) => {
    if (!userId || !budget?.id) return;

    const expense: Expense = {
      ...existingExpense,
      amount: values.amount,
      date: values.date,
      description: values.description,
      splits: values.splits.map((s) => ({
        categoryId: s.categoryId,
        amount: s.amount,
        description: s.description,
      })),
    };

    await patchMutation.mutateAsync({
      expense,
    });
  };

  const dialogTrigger = <div className="hover:cursor-pointer">{children}</div>;

  const inputFields = (
    <>
      <FormInputField
        form={form}
        name="description"
        label="Description"
        placeholder="e.g., Groceries"
      />
      <FormInputField form={form} name="amount" label="Amount" type="number" placeholder="0.00" />
      <FormInputField form={form} name="date" label="Date" type="date" placeholder="YYYY-MM-DD" />
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Edit Expense"
      itemType="Expense"
      description="Make changes to your expense here. Click save when you're done."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
      destructiveElements={
        <DeleteDialog
          key={existingExpense.id}
          onDelete={() =>
            deleteMutation.mutate({
              expense: existingExpense,
            })
          }
          itemType="Expense"
          additionalText={`You are about to delete the expense: ${existingExpense.description}`}
        />
      }
    />
  );
};
