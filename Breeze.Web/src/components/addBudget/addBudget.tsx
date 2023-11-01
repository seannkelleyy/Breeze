import { useState } from 'react'
import { BudgetCategory } from './CreateBudgetCategory'
import './addBudget.css'
import BudgetIncome from './CreateBudgetIncome'
import { getMonthAsString } from '../../utils/GetMonth'
import { Budget } from '../../models/budget'

export const AddBudgetPage = () => {
	const today = new Date()
	const [totalIncome, setTotalIncome] = useState<number>(0)
	const [totalExpenses, setTotalExpenses] = useState<number>(0)
	const [numberOfCategories, setNumberOfCategories] = useState<number>(0)
	const [budgetName, setBudgetName] = useState<string>((getMonthAsString(today.getMonth()) + ' ' + today.getFullYear()).toString())

	const newBudget: Budget = {
		date: today,
		monthlyIncome: totalIncome,
		monthlySavings: totalIncome - totalExpenses,
		categories: [],
		incomes: [],
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		console.log(e)
	}

	return (
		<div className='page'>
			<h1>Add Budget</h1>
			<section className='budget-creation-progress'>
				<h3>Income: ${totalIncome}</h3>
				<h3>Expenses: ${totalExpenses}</h3>
				<h3>Amount left to allocate: ${totalIncome - totalExpenses}</h3>
			</section>
			<form onSubmit={handleSubmit}>
				<section className='budget-income-creation'>
					<BudgetIncome setTotalIncome={setTotalIncome} />
				</section>
				<section className='budget-category-creation'>
					<BudgetCategory
						addTotalExpenses={setTotalExpenses}
						budget={newBudget}
					/>
					<button>Add Category</button>
				</section>
			</form>
		</div>
	)
}
