import { useState, useRef } from 'react'
import { Income } from '../../models/income'
import { useBudget } from '../../services/budgetContext/BudgetContext'
import { BreezeButton } from '../shared/BreezeButton'

export const BudgetIncome = () => {
	const budgetContext = useBudget()
	const oldValue = useRef(budgetContext.budget.monthlyIncome)
	const [income, setIncome] = useState<Income>({
		name: '',
		date: new Date(),
		amount: 0,
		budgetId: budgetContext.budget.id,
	})

	const handleAdd = () => {
		budgetContext.budget.monthlyIncome += income.amount
		budgetContext.budget.incomes.push(income)
	}

	return (
		<section className='section-add-container'>
			<input
				className='breeze-input'
				type='text'
				placeholder='Income Name'
				onChange={(e) => {
					setIncome({ ...income, name: e.target.value })
				}}
			/>
			<input
				className='breeze-input'
				type='number'
				placeholder='Income Amount'
				onChange={(e) => {
					oldValue.current = budgetContext.budget.monthlyIncome
					setIncome({ ...income, amount: parseInt(e.target.value) })
					budgetContext.budget.monthlyIncome += income.amount
					budgetContext.budget.incomes.push(income)
				}}
			/>
			<p>{budgetContext.budget.monthlyIncome}</p>
			<BreezeButton
				text='Add'
				onClick={() => {
					handleAdd
				}}
			/>
		</section>
	)
}
