import { useState } from 'react'
import { Income } from '../../models/income'
import { useBudget } from '../budget/budgetContext/BudgetContext'

export const BudgetIncome = () => {
	const budget = useBudget()
	const [income, setIncome] = useState<Income>({
		name: '',
		date: new Date(),
		amount: 0,
		budgetId: useBudget().id,
	})

	return (
		<section className='section-add-container'>
			<input
				className='breeze-input'
				type='text'
				id='income-name'
				placeholder='Income Name'
				onChange={(e) => {
					setIncome({ ...income, name: e.target.value })
				}}
			/>
			<input
				className='breeze-input'
				type='number'
				id='income-amount'
				placeholder='Income Amount'
				onBlur={(e) => {
					setIncome({ ...income, amount: parseInt(e.target.value) })
					budget.monthlyIncome += income.amount
					budget.incomes.push(income)
				}}
			/>
			<p>{budget.monthlyIncome}</p>
		</section>
	)
}
