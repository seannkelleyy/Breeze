'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { useBudgetContext } from '@/app/budget/providers/index';
import { usePostCategory } from '@/app/budget/hooks/category/index';
import { Category, CategoryFormData, categoryFormSchema } from '@/app/budget/types/category';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export const CreateCategoryDialog = () => {
  const { userId } = useCurrentUser();
  const { budget, refetchBudget, refetchCategories } = useBudgetContext();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      allocation: '',
    },
  });

  const postMutation = usePostCategory({
    onSettled: () => {
      refetchBudget();
      refetchCategories();
    },
  });

  const onSubmit = async (values: CategoryFormData) => {
    if (!userId || !budget?.id) return;
    const category: Omit<
      Category,
      'id' | 'userId' | 'budgetId' | 'currentSpend' | 'createdAt' | 'updatedAt'
    > = {
      name: values.name,
      allocation: values.allocation,
      sourceType: 'MANUAL',
    };
    await postMutation.mutateAsync({ budgetId: budget!.id, userId, category });
  };

  const dialogTrigger = (
    <Button variant="outline" size="sm">
      Add Category
    </Button>
  );

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
      title="Create Category"
      itemType="Category"
      description="Add a new budget category with a monthly allocation."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
    />
  );
};

export default CreateCategoryDialog;
