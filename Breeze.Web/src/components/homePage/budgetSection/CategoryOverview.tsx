/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react'
import { Category } from '../../../services/models/category'
import { BreezeCard } from '../../shared/BreezeCard'
import { BreezeButton } from '../../shared/BreezeButton'
import { BreezeBox } from '../../shared/BreezeBox'
import { BreezeText } from '../../shared/BreezeText'
import { BreezeProgressBar } from '../../shared/BreezeProgressBar'

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
					text={`$${category.curentSpend} of $${category.allocation}`}
					type='large'
				/>
			</BreezeBox>
			<BreezeProgressBar
				title='Category Progress Bar'
				percentage={(category.curentSpend / category.allocation) * 100}
			/>
			<BreezeText
				text={`Remaining: $${category.allocation - category.curentSpend}`}
				type='medium'
			/>
			<BreezeButton
				text='See Expenses'
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
										text={`Date: ${expense.date.toLocaleDateString()}`}
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
