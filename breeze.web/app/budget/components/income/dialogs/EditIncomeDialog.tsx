'use client';

import { ReactNode } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { Income, IncomeFormData, incomeFormSchema } from '@/app/budget/types/income';
import { useBudgetContext } from '@/app/budget/providers/index';
import { useDeleteIncome, usePatchIncome } from '@/app/budget/hooks/income/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import DeleteDialog from '@/components/common/dialog/DeleteDialog';

interface EditIncomeDialogProps {
  existingIncome: Income;
  children?: ReactNode;
}

/**
 * Dialog component for editing an existing income.
 * @param {Income} existingIncome - The income to be edited.
 * @param {ReactNode} children - Optional trigger element for the dialog.
 * @returns {JSX.Element} The EditIncomeDialog component.
 */
export const EditIncomeDialog = ({ existingIncome, children }: EditIncomeDialogProps) => {
  const { userId } = useCurrentUser();
  const { budget, refetchIncomes, refetchBudget } = useBudgetContext();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      name: existingIncome.name,
      amount: existingIncome.amount,
      date: existingIncome.date,
    },
  });

  const patchMutation = usePatchIncome({
    onSettled: () => {
      refetchBudget();
      refetchIncomes();
    },
  });

  const deleteMutation = useDeleteIncome({
    onSettled: () => {
      refetchBudget();
      refetchIncomes();
    },
  });

  const onSubmit = async (values: IncomeFormData) => {
    if (!userId || !budget?.id) return;

    const income: Income = {
      ...existingIncome,
      name: values.name,
      amount: values.amount,
      date: values.date,
    };

    patchMutation.mutate({
      income,
    });
  };

  const dialogTrigger = <div className="hover:cursor-pointer">{children}</div>;

  const inputFields = (
    <>
      <FormInputField form={form} name="name" label="Name" placeholder="e.g., Paycheck" />
      <FormInputField form={form} name="amount" label="Amount" type="number" placeholder="0.00" />
      <FormInputField form={form} name="date" label="Date" type="date" placeholder="YYYY-MM-DD" />
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Edit Income"
      itemType="Income"
      description="Make changes to your income here. Click save when you're done."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
      destructiveElements={
        <DeleteDialog
          key={existingIncome.id}
          onDelete={() =>
            deleteMutation.mutate({
              income: existingIncome,
            })
          }
          itemType="Income"
          additionalText={`You are about to delete the income: ${existingIncome.name}`}
        />
      }
    />
  );
};
