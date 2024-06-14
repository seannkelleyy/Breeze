/* eslint-disable no-mixed-spaces-and-tabs */
import { useEffect, useState } from 'react'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'
import { BreezeProgressBar } from '../../../components/shared/BreezeProgressBar'
import { ExpenseItem } from './ExpenseItem'
import { Category } from '@/services/hooks/httpServices/CategoryServices'
import { useFetchExpenses } from '@/services/hooks/expense/useGetExpenses'

type categoryItemProps = {
	category: Category
}

/**
 * Component that gives an overview of a category, including the name, amount, current spend, and expenses.
 * @param props.category: The category to give an overview of.
 */
export const CategoryOverview = ({ category }: categoryItemProps) => {
	const { data: expenses, status, refetch } = useFetchExpenses({ category })
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const [seeExpenses, setSeeExpenses] = useState<boolean>(false)
	const categoryPercentage = (category.currentSpend / category.allocation) * 100

	useEffect(() => {
		refetch()
	}, [refetch, expenses])

	// TODO: Replace loading with skeleton loader
	return (
		<BreezeCard
			title='Category Overview'
			style={{
				width: '100%',
			}}
		>
			<BreezeBox
				title='category-item-info'
				direction='row'
			>
				<BreezeText
					text={category.name}
					type='small-heading'
				/>
				<BreezeText
					text={`$${category.currentSpend} of $${category.allocation}`}
					type='large'
				/>
			</BreezeBox>
			<BreezeProgressBar
				title='Category Progress Bar'
				percentage={categoryPercentage < 100 ? categoryPercentage : 100}
			/>
			<BreezeText
				text={`Remaining: $${category.allocation - category.currentSpend}`}
				type='medium'
			/>
			{category.currentSpend != 0 && (
				<>
					<BreezeButton
						content='See Expenses'
						onClick={() => {
							setSeeExpenses(!seeExpenses)
						}}
					/>
					{seeExpenses &&
						(status === 'success' ? (
							expenses.length > 0 &&
							expenses.map((expense, index) => (
								<ExpenseItem
									key={index}
									expense={expense}
									refetchExpenses={refetch}
								/>
							))
						) : status === 'loading' ? (
							<BreezeText
								text='Loading...'
								type='medium'
							/>
						) : (
							<BreezeText
								text='Error loading expenses'
								type='medium'
							/>
						))}
				</>
			)}
		</BreezeCard>
	)
}
