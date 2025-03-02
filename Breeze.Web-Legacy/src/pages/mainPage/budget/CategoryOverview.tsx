import { useState } from 'react'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'
import { BreezeProgressBar } from '../../../components/shared/BreezeProgressBar'
import { ExpenseItem } from './expenses/ExpenseItem'
import { useFetchExpenses } from '@/services/hooks/expense/useFetchExpenses'
import { Category } from '@/services/hooks/category/categoryServices'
import { LoadingEffect } from '@/components/shared/LoadingEffect'

type categoryItemProps = {
	category: Category
}

/**
 * Component that gives an overview of a category, including the name, amount, current spend, and expenses.
 * @param props.category: The category to give an overview of.
 */
export const CategoryOverview = ({ category }: categoryItemProps) => {
	const { data: expenses, status, refetch } = useFetchExpenses({ category })
	const [seeExpenses, setSeeExpenses] = useState<boolean>(false)
	const categoryPercentage = (category.currentSpend / category.allocation) * 100

	if (status === 'loading') return <LoadingEffect />

	if (status === 'error')
		return (
			<BreezeText
				text='Error loading expenses'
				type='medium'
			/>
		)

	return (
		<BreezeCard title='Category Overview'>
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
						expenses &&
						expenses.map((expense) => (
							<ExpenseItem
								key={expense.id}
								expense={expense}
								refetchExpenses={refetch}
							/>
						))}
				</>
			)}
		</BreezeCard>
	)
}
