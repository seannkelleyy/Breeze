import { useState } from 'react'

type BudgetCategoryProps = {
	createBudgetCategory: (budgetCategory: any) => void
	addExpenese: (expense: any) => void
	budgetId: number
}

export const BudgetCategory = (props: BudgetCategoryProps) => {
	const [budgetCategory, setBudgetCategory] = useState({
		name: '',
		amount: 0,
		budgetId: props.budgetId,
	})

	const handleChange = (event: any) => {
		setBudgetCategory({
			...budgetCategory,
			[event.target.name]: event.target.value,
		})
	}

	const handleSubmit = (event: any) => {
		event.preventDefault()
		props.createBudgetCategory(budgetCategory)
		setBudgetCategory({
			name: '',
			amount: 0,
			budgetId: props.budgetId,
		})
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<label>
					Name:
					<input
						type='text'
						name='name'
						value={budgetCategory.name}
						onChange={handleChange}
					/>
				</label>
				<label>
					Amount:
					<input
						type='number'
						name='amount'
						value={budgetCategory.amount}
						onChange={handleChange}
					/>
				</label>
			</form>
		</div>
	)
}
