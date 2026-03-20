import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * GoalSkeleton component to display loading skeletons for goals.
 * @returns {JSX.Element} The GoalSkeleton component.
 */
export const GoalSkeleton = () => {
	return (
		<Card className='flex flex-col gap-4 justify-center items-center rounded-md p-4 my-4'>
			<Skeleton className='h-[30px] w-[210px] rounded-full' />
			<Skeleton className='h-[30px] w-[250px] rounded-full' />
			<Skeleton className='h-[30px] w-[230px] rounded-full' />
			<Skeleton className='h-[30px] w-[100px] rounded-full' />
		</Card>
	)
}

