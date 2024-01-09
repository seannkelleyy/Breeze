/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react'
import { Category } from '../../../models/category'
import { BreezeBox } from '../../shared/BreezeBox'
import { BreezeButton } from '../../shared/BreezeButton'

type categoryItemProps = {
	category: Category
}
export const CategoryOverview = (props: categoryItemProps) => {
	const { category } = props
	const [seeExpeneses, setSeeExpenses] = useState<boolean>(false)
	return (
		<BreezeBox title='Category Overview'>
			<div className='category-item-info'>
				<h2>{category.name}</h2>
				<h3>
					${category.curentSpend} of ${category.amount}
				</h3>
			</div>
			<div className='category-item-info-bar'>
				<div
					className='category-item-info-bar-fill'
					style={{
						width: `${(category.curentSpend / category.amount) * 100}%`,
					}}
				/>
			</div>
			<h3>Remaining: ${category.amount - category.curentSpend}</h3>
			<BreezeButton
				text='See Expenses'
				onClick={() => setSeeExpenses(!seeExpeneses)}
			/>
			<section className='category-item-expenses'>
				{seeExpeneses
					? category.expenses
						? category.expenses.map((expense, index) => (
								<div
									className='expense'
									key={index}
								>
									<h4>Name: {expense.name}</h4>
									<h4>Amount: ${expense.amount}</h4>
									<h4>Date: {expense.date.toLocaleDateString()}</h4>
								</div>
						  ))
						: null
					: null}
			</section>
		</BreezeBox>
	)
}
