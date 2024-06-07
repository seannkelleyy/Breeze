/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'
import { BreezeProgressBar } from '../../../components/shared/BreezeProgressBar'
import { Category } from '../../../services/hooks/CategoryServices'
import { useExpenses } from '../../../services/hooks/ExpenseServices'
import { useQuery } from 'react-query'
import { useDateContext } from '../../../services/providers/DateProvider'

type categoryItemProps = {
	category: Category
}

/**
 * Component that gives an overview of a category, including the name, amount, current spend, and expenses.
 * @param props.category: The category to give an overview of.
 */
export const CategoryOverview = ({ category }: categoryItemProps) => {
	const { getMonthAsString } = useDateContext()
	const { getExpenses } = useExpenses()
	const { data: expenses, status } = useQuery(['expenses', category], () => getExpenses(category))
	const [seeExpenses, setSeeExpenses] = useState<boolean>(false)
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
				percentage={(category.currentSpend / category.allocation) * 100}
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
							expenses.map((expense, index) => (
								<BreezeBox
									title='Expenses'
									key={index}
									style={{
										borderBottom: '1px solid var(--border)',
										width: '80%',
										padding: '0.5rem',
									}}
								>
									<BreezeText
										text={`Name: ${expense.name}`}
										type='medium'
									/>
									<BreezeText
										text={`Amount: $${expense.amount}`}
										type='medium'
									/>
									<BreezeText
										text={`Date: ${getMonthAsString(expense.month)} ${expense.day} ${expense.year}`}
										type='medium'
									/>
								</BreezeBox>
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
