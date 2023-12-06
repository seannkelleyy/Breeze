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
	const [totalIncome, setTotalIncome] = useState<number>(0)
	const [totalExpenses, setTotalExpenses] = useState<number>(0)
	const [numberOfCategories, setNumberOfCategories] = useState<number>(0)
	const [numberOfIncomes, setNumberOfIncomes] = useState<number>(0)

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		console.log(e)
	}

	return (
		<BudgetProvider>
			<div className='page'>
				<h1>Add Budget</h1>
				<section className='budget-creation-progress'>
					<h3>Income: ${totalIncome}</h3>
					<h3>Expenses: ${totalExpenses}</h3>
					<h3>Amount left to allocate: ${totalIncome - totalExpenses}</h3>
					<h3>
						Date: {month} {year}
					</h3>
				</section>
				<form
					className='categories'
					onSubmit={handleSubmit}
				>
					<section className='budget-income-creation'>
						{Array.from({ length: numberOfIncomes }).map((_, index) => (
							<BudgetIncome
								key={index}
								setTotalIncome={setTotalIncome}
							/>
						))}
						<button onClick={() => setNumberOfIncomes(numberOfIncomes + 1)}>Add Income</button>
					</section>
					<section className='budget-category-creation'>
						{Array.from({ length: numberOfCategories }).map((_, index) => (
							<BudgetCategory
								key={index}
								addTotalExpenses={setTotalExpenses}
								budget={budget}
							/>
						))}
						<button onClick={() => setNumberOfCategories(numberOfCategories + 1)}>Add Category</button>
					</section>
				</form>
			</div>
		</BudgetProvider>
	)
}
