'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog';
import { FormInputField } from '../../../../../components/common/form/FormInputField';
import { Goal, goalFormSchema } from '@/app/budget/types/goal';
import { usePostGoal } from '@/app/budget/hooks/goal/index';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

interface CreateGoalDialogProps {
  refetchGoals: () => void;
}

/**
 * Dialog component for creating a new goal.
 * @param {() => void} refetchGoals - Function to refetch the list of goals after a new goal is created.
 * @returns {JSX.Element} The CreateGoalDialog component.
 */
export const CreateGoalDialog = ({ refetchGoals }: CreateGoalDialogProps) => {
  const { userId } = useCurrentUser();

  const form = useForm<Goal>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      userId,
      description: '',
      isCompleted: false,
    },
  });

  const postGoalMutation = usePostGoal({
    onSettled: () => {
      refetchGoals();
    },
  });

  const onSubmit = async (values: Goal) => {
    if (!userId) return;

    await postGoalMutation.mutateAsync({
      goal: {
        userId,
        description: values.description,
        isCompleted: false,
      },
    });
  };

  const dialogTrigger = <Button className="w-fit self-center">Create Goal</Button>;

  const inputFields = (
    <FormInputField
      form={form}
      name="description"
      label="Goal Description"
      placeholder="Enter your goal"
    />
  );

  return (
    <BreezeFormDialog
      dialogTrigger={dialogTrigger}
      title="Create Goal"
      itemType="Goal"
      description="Create a new goal. Click save when you're done."
      form={form}
      onSubmit={onSubmit}
      inputFields={inputFields}
    />
  );
};
