import { useState } from 'react'
import { BudgetCategory } from './CreateBudgetCategory'
import BudgetIncome from './CreateBudgetIncome'
import { getMonthAsString } from '../../utils/GetMonth'
import './addBudget.css'
import { BudgetProvider, useBudget, useBudgetUpdate } from '../budget/budgetContext/BudgetContext'
import { months } from '../../utils/months'

export const AddBudgetPage = () => {
	const budget = useBudget()
	const updateBudget = useBudgetUpdate()
	const today = new Date()
	const [totalIncome, setTotalIncome] = useState<number>(0)
	const [totalExpenses, setTotalExpenses] = useState<number>(0)
	const [numberOfCategories, setNumberOfCategories] = useState<number>(0)
	const [numberOfIncomes, setNumberOfIncomes] = useState<number>(0)
	const [budgetMonth, setBudgetMonth] = useState<string>(getMonthAsString(today.getMonth()))
	const [budgetYear, setBudgetYear] = useState<number>(today.getFullYear())

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
						Date: {budgetMonth} {budgetYear}
					</h3>
				</section>
				<form
					className={'categories'}
					onSubmit={handleSubmit}
				>
					<section className='budget-date'>
						<label htmlFor='budget-month'>Month</label>
						<select
							title='month'
							defaultValue={budgetMonth}
							onChange={(e) => setBudgetMonth(e.target.value)}
						>
							{months.map((month) => (
								<option
									key={month}
									value={month}
								>
									{month}
								</option>
							))}
						</select>
						<label htmlFor='budget-year'>Year</label>
						<select
							title='month'
							defaultValue={budgetYear}
							onChange={(e) => setBudgetYear(Number(e.target.value))}
						>
							<option value={today.getFullYear()}>{today.getFullYear()}</option>
							<option value={today.getFullYear() + 1}>{today.getFullYear() + 1}</option>
							<option value={today.getFullYear() + 2}>{today.getFullYear() + 2}</option>
							<option value={today.getFullYear() + 3}>{today.getFullYear() + 3}</option>
						</select>
					</section>
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
