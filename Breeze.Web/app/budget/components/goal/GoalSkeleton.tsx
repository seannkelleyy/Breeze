import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * GoalSkeleton component to display loading skeletons for goals.
 * @returns {JSX.Element} The GoalSkeleton component.
 */
export const GoalSkeleton = () => {
  return (
    <Card className="my-4 flex flex-col items-center justify-center gap-4 rounded-md p-4">
      <Skeleton className="h-[30px] w-[210px] rounded-full" />
      <Skeleton className="h-[30px] w-[250px] rounded-full" />
      <Skeleton className="h-[30px] w-[230px] rounded-full" />
      <Skeleton className="h-[30px] w-[100px] rounded-full" />
    </Card>
  );
};
