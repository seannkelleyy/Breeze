'use client';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useBudgetContext } from '@/app/budget/providers/index';
import { Income, IncomeFormData, incomeFormSchema } from '@/app/budget/types/income';
import { BreezeFormDialog } from '@/components/common/form/BreezeFormDialog';
import { FormInputField } from '@/components/common/form/FormInputField';
import { Button } from '@/components/ui/button';
import { usePostIncome } from '@/app/budget/hooks/income/index';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

/**
 * Component for creating a new income.
 * @returns {JSX.Element} The CreateIncomeDialog component.
 */
export const CreateIncomeDialog = () => {
  const { userId } = useCurrentUser();
  const { budget, refetchIncomes, refetchBudget } = useBudgetContext();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const postMutation = usePostIncome({
    onSettled: () => {
      refetchIncomes();
      refetchBudget();
    },
  });

  const onSubmit = (values: IncomeFormData) => {
    if (!userId || !budget?.id) return;
    const income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sourceType'> = {
      budgetId: budget.id,
      name: values.name,
      amount: values.amount,
      date: values.date,
    };
    postMutation.mutate({
      budgetId: budget.id,
      userId,
      income,
    });
  };

  const dialogTrigger = <Button>Add Income</Button>;

  const inputFields = (
    <>
      <p className="text-muted-foreground text-sm">
        For recurring payroll, use Manage Recurring Templates.
      </p>
      <FormInputField form={form} name="name" label="Name" placeholder="e.g., Paycheck" />
      <FormInputField form={form} name="amount" label="Amount" type="number" placeholder="0.00" />
      <FormInputField form={form} name="date" label="Date" type="date" placeholder="YYYY-MM-DD" />
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Create Income"
      itemType="Income"
      description="Add a new income entry."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
    />
  );
};
