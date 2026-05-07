import { Button } from '@/components/ui/button';
import { GoalSkeleton } from './GoalSkeleton';
import { CreateGoalDialog } from './dialogs/CreateGoalDialog';
import { EditGoalDialog } from './dialogs/EditGoalDialog';
import { useFetchGoals } from '../../hooks/goal/index';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

/**
 * Goals component for displaying a list of user goals.
 * @returns {JSX.Element} The Goals component that displays a list of user goals.
 */
export const Goals = () => {
  const { userId } = useCurrentUser();
  const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId });

  if (!userId) {
    return null;
  }

  const sortedGoals = goals ? [...goals].sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1)) : goals;

  if (isLoading) return <GoalSkeleton />;

  if (isError)
    return (
      <Card className="my-4 flex flex-col items-center justify-center gap-4 rounded-md p-4">
        <p className="text-center">Error Loading Goals</p>
        <Button onClick={() => refetch()}>Refetch Goals</Button>
      </Card>
    );

  if (!sortedGoals || sortedGoals.length === 0) {
    return (
      <Card className="items-evenly my-4 flex w-[80%] max-w-[95%] flex-col space-y-4 rounded-md p-4 md:max-w-[400px]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Goals</h1>
        </div>
        <p className="text-center">No goals found</p>
        <CreateGoalDialog refetchGoals={refetch} />
      </Card>
    );
  }

  return (
    <Card className="items-evenly my-4 flex w-[80%] max-w-[95%] flex-col space-y-4 rounded-md p-4 md:max-w-[400px]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
      </div>
      <ul className="space-y-2">
        {sortedGoals.map((goal) => (
          <EditGoalDialog existingGoal={goal} refetchGoals={refetch} key={goal.id}>
            <li
              className="hover:bg-accent mx-auto flex items-center justify-center gap-16 rounded-md p-2"
              key={goal.id}
            >
              <p className="text-xl">
                {goal.isCompleted ? <del>{goal.description}</del> : goal.description}
              </p>
            </li>
          </EditGoalDialog>
        ))}
      </ul>
      <CreateGoalDialog refetchGoals={refetch} />
    </Card>
  );
};
