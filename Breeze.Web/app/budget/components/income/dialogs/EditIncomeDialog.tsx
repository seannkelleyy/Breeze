'use client';
import { ReactNode, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { FormSelectField } from '../../../../../components/common/form/FormSelectField';
import { Income, incomeFormSchema } from '@/app/budget/types/income';
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

  const form = useForm<Income>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      ...existingIncome,
      recurrenceInterval: existingIncome.recurrenceInterval ?? 'none',
      paydayDayOfMonth: existingIncome.paydayDayOfMonth ?? new Date(existingIncome.date).getDate(),
    },
  });

  const recurrenceInterval = form.watch('recurrenceInterval') ?? 'none';

  useEffect(() => {
    if (
      !['monthly', 'quarterly', 'yearly'].includes(recurrenceInterval) &&
      form.getValues('paydayDayOfMonth') !== null
    ) {
      form.setValue('paydayDayOfMonth', null, { shouldValidate: true });
    }
  }, [form, recurrenceInterval]);

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

  const onSubmit = (values: Income) => {
    if (!userId || !budget?.id) return;
    const fallbackPayday = new Date(values.date).getDate();
    const normalizedMonthlyPayday =
      typeof values.paydayDayOfMonth === 'number' &&
      values.paydayDayOfMonth >= 1 &&
      values.paydayDayOfMonth <= 31
        ? values.paydayDayOfMonth
        : fallbackPayday;

    patchMutation.mutate({
      income: {
        ...values,
        id: existingIncome.id,
        userId,
        budgetId: budget.id,
        isRecurring: values.recurrenceInterval !== 'none',
        paydayDayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(
          values.recurrenceInterval ?? 'none',
        )
          ? normalizedMonthlyPayday
          : null,
      },
    });
  };

  const dialogTrigger = <div className="hover:cursor-pointer">{children}</div>;

  const inputFields = (
    <>
      <FormInputField form={form} name="name" label="Name" placeholder="e.g., Paycheck" />
      <FormInputField form={form} name="amount" label="Amount" type="number" placeholder="0.00" />
      <FormSelectField
        form={form}
        name="recurrenceInterval"
        label="Pay Interval"
        parseAsNumber={false}
        options={[
          { value: 'none', label: 'One-time income' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'biweekly', label: 'Biweekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'yearly', label: 'Yearly' },
        ]}
      />
      {['monthly', 'quarterly', 'yearly'].includes(recurrenceInterval) ? (
        <FormInputField
          form={form}
          name="paydayDayOfMonth"
          label="Payday (Day of Month)"
          type="number"
          placeholder="1-31"
        />
      ) : null}
      {recurrenceInterval === 'weekly' || recurrenceInterval === 'biweekly' ? (
        <p className="text-muted-foreground text-sm">
          Date is your pay anchor (for example, your first Thursday paycheck).
        </p>
      ) : null}
      <FormInputField form={form} name="date" label="Date" type="date" placeholder="YYYY-MM-DD" />
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Edit Income"
      itemType="Income"
      description="Make changes to your income here."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
      destructiveElements={
        <DeleteDialog
          key={existingIncome.id}
          onDelete={() => deleteMutation.mutate({ income: existingIncome })}
          additionalText={`You are about to delete the income: ${existingIncome.name}`}
          itemType="Income"
        />
      }
    />
  );
};
