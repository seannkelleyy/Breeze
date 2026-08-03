'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useBudgetContext } from '../../../providers';
import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { useDeleteCategory, usePatchCategory } from '@/app/budget/hooks/category/index';
import { Category, CategoryFormData, categoryFormSchema } from '@/app/budget/types/category';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import DeleteDialog from '@/components/common/dialog/DeleteDialog';

type EditCategoryDialogProps = {
  existingCategory: Category;
  children?: React.ReactNode;
};

export const EditCategoryDialog = ({ existingCategory, children }: EditCategoryDialogProps) => {
  const { userId } = useCurrentUser();
  const { budget, refetchBudget, refetchCategories } = useBudgetContext();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: existingCategory.name,
      allocation: existingCategory.allocation,
    },
  });

  const patchMutation = usePatchCategory({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
    },
  });

  const deleteMutation = useDeleteCategory({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
    },
  });

  const onSubmit = async (values: CategoryFormData) => {
    if (!userId || !budget?.id) return;
    const category: Category = {
      ...existingCategory,
      name: values.name,
      allocation: values.allocation,
    };
    await patchMutation.mutateAsync({ category });
  };

  const dialogTrigger = <div className="hover:cursor-pointer">{children}</div>;

  const inputFields = (
    <>
      <FormInputField form={form} name="name" label="Name" placeholder="e.g., Groceries" />
      <FormInputField
        form={form}
        name="allocation"
        label="Monthly Allocation"
        type="number"
        placeholder="0.00"
      />
    </>
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Edit Category"
      itemType="Category"
      description="Make changes to your category here."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
      destructiveElements={
        <DeleteDialog
          key={existingCategory.id}
          onDelete={async () => deleteMutation.mutateAsync({ category: existingCategory })}
          itemType="Category"
          additionalText={`You are about to delete the category: ${existingCategory.name}`}
        />
      }
    />
  );
};

export default EditCategoryDialog;
