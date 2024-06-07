/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'
import { BreezeProgressBar } from '../../../components/shared/BreezeProgressBar'
import { Category } from '../../../services/hooks/CategoryServices'

type categoryItemProps = {
	category: Category
}

/**
 * Component that gives an overview of a category, including the name, amount, current spend, and expenses.
 * @param props.category: The category to give an overview of.
 */
export const CategoryOverview = (props: categoryItemProps) => {
	const { category } = props
	const [seeExpeneses, setSeeExpenses] = useState<boolean>(false)
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
			<BreezeButton
				content='See Expenses'
				onClick={() => setSeeExpenses(!seeExpeneses)}
			/>
			<BreezeBox title='Category Item Expenses'>
				{seeExpeneses
					? category.expenses
						? category.expenses.map((expense, index) => (
								<BreezeBox
									title='Expense'
									key={index}
									style={{
										borderBottom: '1px solid var(--border)',
										width: '120%',
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
										text={`Date: ${expense.year}-${expense.month}-${expense.day}`}
										type='medium'
									/>
								</BreezeBox>
						  ))
						: null
					: null}
			</BreezeBox>
		</BreezeCard>
	)
}
