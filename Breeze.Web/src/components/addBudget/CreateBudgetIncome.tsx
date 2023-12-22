import { useState } from 'react'
import { Income } from '../../models/income'
import { useBudget } from '../budget/budgetContext/BudgetContext'

type BudgetIncomeProps = {
	setTotalIncome: (income: number) => void
	onSubmit?: (income: Income) => void
	Month: string
	Year: string
}

const BudgetIncome = (props: BudgetIncomeProps) => {
	const [income, setIncome] = useState<Income>({
		name: '',
		date: new Date(),
		amount: 0,
		budgetId: useBudget().id,
	})

	const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIncome({ ...income, amount: parseInt(e.target.value) })
		props.setTotalIncome(parseInt(e.target.value))
	}
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
				onChange={(e) => {
					handleIncomeChange(e)
				}}
			/>
		</section>
	)
}

export default BudgetIncome
