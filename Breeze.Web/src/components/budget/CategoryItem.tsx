/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react'
import { Category } from '../../models/category'

type categoryItemProps = {
	category: Category
}
const CategoryItem = (props: categoryItemProps) => {
	const [seeExpeneses, setSeeExpenses] = useState<boolean>(false)
	return (
		<div className='category-item'>
			<div className='category-item-info'>
				<h2>{props.category.name}</h2>
				<h3>
					${props.category.curentSpend} of ${props.category.budget}
				</h3>
			</div>
			<div className='category-item-info-bar'>
				<div
					className='category-item-info-bar-fill'
					style={{
						width: `${(props.category.curentSpend / props.category.budget) * 100}%`,
					}}
				/>
			</div>
			<h3>Amount Left: ${props.category.budget - props.category.curentSpend}</h3>
			<button
				className='category-item-button'
				onClick={() => setSeeExpenses(!seeExpeneses)}
			>
				See Expenses
			</button>
			<section className='category-item-expenses'>
				{seeExpeneses
					? props.category.expenses
						? props.category.expenses.map((expense, index) => (
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
		</div>
	)
}

export default CategoryItem
