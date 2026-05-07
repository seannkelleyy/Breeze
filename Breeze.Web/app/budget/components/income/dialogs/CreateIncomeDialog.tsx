'use client';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useBudgetContext } from '@/app/budget/providers/index';
import { Income, incomeFormSchema } from '@/app/budget/types/income';
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

  const form = useForm<Income>({
    resolver: zodResolver(incomeFormSchema),
    mode: 'onChange',
    defaultValues: {
      userId,
      budgetId: budget?.id ?? -1,
      name: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (budget?.id && form.getValues('budgetId') !== budget.id) {
      form.setValue('budgetId', budget.id);
    }
  }, [form, budget?.id]);

  const postMutation = usePostIncome({
    onSettled: () => {
      refetchIncomes();
      refetchBudget();
    },
  });

  const onSubmit = (values: Income) => {
    if (!userId || !budget?.id) return;
    postMutation.mutate({
      budgetId: budget.id,
      income: {
        ...values,
        userId,
        budgetId: budget.id,
        isRecurring: false,
        recurrenceInterval: 'none',
        paydayDayOfMonth: null,
      },
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
