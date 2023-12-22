import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BudgetCategory } from './CreateBudgetCategory'
import BudgetIncome from './CreateBudgetIncome'
import './addBudget.css'
import { BudgetProvider, useBudget, useBudgetUpdate } from '../budget/budgetContext/BudgetContext'

export const AddBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const budget = useBudget()
	const updateBudget = useBudgetUpdate()
	const [totalIncome, setTotalIncome] = useState<number>(10)
	const [totalExpenses, setTotalExpenses] = useState<number>(90)

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		console.log(e)
	}

	return (
		<BudgetProvider>
			<div className='page'>
				<h1>Add Budget</h1>
				<section className='budget-creation-progress'>
					<h3>
						Date: {month} {year}
					</h3>
					<h3>Income: ${totalIncome ? totalIncome : 0}</h3>
					<h3>Expenses: ${totalExpenses ? totalExpenses : 0}</h3>
					<div className={totalIncome - totalExpenses >= 0 ? 'amount-left-positive' : 'amount-left-negative'}>
						<h3>Amount left to allocate: ${totalIncome && totalExpenses ? totalIncome - totalExpenses : 0}</h3>
					</div>
				</section>
				<form
					className='budget-creation-form'
					onSubmit={handleSubmit}
				></form>
			</div>
		</BudgetProvider>
	)
}
