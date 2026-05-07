'use client';
import { useEffect } from 'react';

import { UseFormReturn } from 'react-hook-form';

import { FormInputField } from '../../../../components/common/form/FormInputField';
import { FormSelectField } from '../../../../components/common/form/FormSelectField';
import { BudgetFormData } from '../../types/budget';
import DeleteDialog from '@/components/common/dialog/DeleteDialog';

type BudgetIncomeItemProps = {
  index: number;
  form: UseFormReturn<BudgetFormData>;
  deleteIncome: (index: number) => void;
};

/**
 * A component representing a single income item in the budget form.
 * @param {number} index - The index of the income item in the form array.
 * @param {UseFormReturn<BudgetFormData>} form - The react-hook-form instance managing the budget form.
 * @param {(index: number) => void} deleteIncome - Function to delete the income at the specified index.
 * @returns {JSX.Element} The rendered income item.
 */
export function BudgetIncomeItem({ index, form, deleteIncome }: BudgetIncomeItemProps) {
  const recurrenceInterval = form.watch(`incomes.${index}.recurrenceInterval`) ?? 'none';

  useEffect(() => {
    if (
      !['monthly', 'quarterly', 'yearly'].includes(recurrenceInterval) &&
      form.getValues(`incomes.${index}.paydayDayOfMonth`) !== null
    ) {
      form.setValue(`incomes.${index}.paydayDayOfMonth`, null, {
        shouldValidate: true,
      });
    }
  }, [form, index, recurrenceInterval]);

  return (
    <section className="bg-background/70 space-y-3 rounded-lg border p-4">
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-6">
        <div className="md:col-span-3">
          <FormInputField
            form={form}
            name={`incomes.${index}.name`}
            label="Name"
            placeholder="Income"
          />
        </div>
        <div className="md:col-span-1">
          <FormInputField
            form={form}
            name={`incomes.${index}.amount`}
            label="Amount"
            type="number"
            placeholder="0"
          />
        </div>
        <div className="md:col-span-2">
          <FormInputField form={form} name={`incomes.${index}.date`} label="Date" type="date" />
        </div>
      </div>
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <FormSelectField
            form={form}
            name={`incomes.${index}.recurrenceInterval`}
            label="Pay Interval"
            placeholder="Interval"
            parseAsNumber={false}
            options={[
              { value: 'none', label: 'One-time' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Biweekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </div>
        <div className="md:col-span-1">
          {['monthly', 'quarterly', 'yearly'].includes(recurrenceInterval) ? (
            <FormInputField
              form={form}
              name={`incomes.${index}.paydayDayOfMonth`}
              label="Payday"
              type="number"
              placeholder="1-31"
            />
          ) : recurrenceInterval === 'none' ? (
            <div className="text-muted-foreground pb-2 text-sm">No payday for one-time income</div>
          ) : (
            <div className="text-muted-foreground pb-2 text-sm">Uses Date as pay anchor</div>
          )}
        </div>
        <div className="md:col-span-2" />
        <div className="flex pt-1 md:col-span-1 md:justify-end">
          <DeleteDialog
            key={form.getValues().incomes[index].id}
            itemType="income"
            additionalText={`You are about to delete the income: ${form.getValues().incomes[index].name}`}
            onDelete={() => deleteIncome(index)}
          />
        </div>
      </div>
    </section>
  );
}
