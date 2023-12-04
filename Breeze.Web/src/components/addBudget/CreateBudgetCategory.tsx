import { useState } from 'react'
import { Category } from '../../models/category'
import { Budget } from '../../models/budget'

type BudgetCategoryProps = {
	budget: Budget
	addTotalExpenses: (number: number) => void
}

export const BudgetCategory = (props: BudgetCategoryProps) => {
	const [categoryName, setCategoryName] = useState<string>('')
	const [categoryAmount, setCategoryAmount] = useState<number>(0)

	const newCategory: Category = {
		name: categoryName,
		curentSpend: 0,
		budget: categoryAmount,
		expenses: [],
	}

	const handleBlur = () => {
		props.budget.categories.push(newCategory)
		props.addTotalExpenses(categoryAmount)
	}
	return (
		<section className='section-add-container'>
			<h3>Category</h3>
			<form onBlur={handleBlur}>
				<label>
					Name:
					<input
						className='breeze-input'
						type='text'
						name='name'
						value={categoryName}
						onChange={(e) => {
							setCategoryName(e.target.value)
						}}
					/>
				</label>
				<label>
					Amount:
					<input
						className='breeze-input'
						type='number'
						name='amount'
						value={categoryAmount}
						onChange={(e) => {
							setCategoryAmount(parseFloat(e.target.value))
						}}
					/>
				</label>
			</form>
		</section>
	)
}
