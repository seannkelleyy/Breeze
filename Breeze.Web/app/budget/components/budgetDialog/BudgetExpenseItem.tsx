import { UseFormReturn } from '@/node_modules/react-hook-form/dist';

import { FormInputField } from '../../../../components/common/form/FormInputField';
import { BudgetFormData } from '../../types/budget';
import DeleteDialog from '@/components/common/dialog/DeleteDialog';

type BudgetExpenseItemProps = {
  index: number;
  form: UseFormReturn<BudgetFormData>;
  deleteCategory: (index: number) => void;
};

/**
 * A component representing a single expense item in the budget form.
 * @param {number} index - The index of the expense item in the form array.
 * @param {UseFormReturn<BudgetFormData>} form - The react-hook-form instance managing the budget form.
 * @param {(index: number) => void} deleteCategory - Function to delete the category at the specified index.
 * @returns {JSX.Element} The rendered expense item.
 */
export function BudgetExpenseItem({ index, form, deleteCategory }: BudgetExpenseItemProps) {
  return (
    <section className="bg-background/70 rounded-lg border p-4">
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-6">
        <div className="md:col-span-4">
          <FormInputField
            form={form}
            name={`categories.${index}.name`}
            label="Name"
            placeholder="Expense"
          />
        </div>
        <div className="md:col-span-1">
          <FormInputField
            form={form}
            name={`categories.${index}.allocation`}
            label="Allocation"
            type="number"
            placeholder="0"
          />
        </div>
        <div className="flex pt-1 md:col-span-1 md:justify-end">
          <DeleteDialog
            key={form.getValues().categories[index].id}
            itemType="expense category"
            additionalText={
              <>
                <p>Deleting this category will remove all expenses associated with it.</p>
                <p>Are you sure you want to delete this category?</p>
              </>
            }
            onDelete={() => deleteCategory(index)}
          />
        </div>
      </div>
    </section>
  );
}
