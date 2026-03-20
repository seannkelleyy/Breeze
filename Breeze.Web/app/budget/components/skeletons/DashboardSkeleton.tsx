import { Skeleton } from '@/components/ui/skeleton'

/**
 * DashboardSkeleton component to display loading skeletons for the dashboard.
 * @returns {JSX.Element} The DashboardSkeleton component.
 */
export const DashboardSkeleton = () => {
	return (
		<div className='h-screen w-screen flex flex-col gap-4 justify-center items-center'>
			<Skeleton className='h-[40px] w-[300px] rounded-full' />
			<Skeleton className='h-[20px] w-[200px] rounded-full' />
			<Skeleton className='h-[20px] w-[210px] rounded-full' />
			<Skeleton className='h-[20px] w-[220px] rounded-full' />
			<Skeleton className='h-[20px] w-[180px] rounded-full' />
			<div className='flex gap-4'>
				<Skeleton className='h-[20px] w-[100px] rounded-full' />
				<Skeleton className='h-[20px] w-[100px] rounded-full' />
				<Skeleton className='h-[20px] w-[100px] rounded-full' />
			</div>
			<Skeleton className='h-[200px] w-[400px] rounded-md' />
			<Skeleton className='h-[20px] w-[100px] rounded-full' />
			<Skeleton className='h-[250px] w-[500px] rounded-md' />
		</div>
	)
}

