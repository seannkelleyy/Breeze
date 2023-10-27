import { useState } from 'react'
import { BudgetCategory } from './CreateBudgetCategory'
import './addBudget.css'

export const AddBudgetPage = () => {
	const [totalIncome, setTotalIncome] = useState<number>(0)
	const [totalExpenses, setTotalExpenses] = useState<number>(0)
	const [numberOfCategories, setNumberOfCategories] = useState<number>(0)

	return (
		<div className='page'>
			<h1>Add Budget</h1>
			<section className='budget-creation=progress'>
				<h3>Income: ${totalIncome}</h3>
				<h3>Expenses: ${totalExpenses}</h3>
				<h3>Amount left to allocate: ${totalIncome - totalExpenses}</h3>
			</section>
			<section className='budget-income-creation'>
				<h3>Income</h3>
				<label htmlFor='income-name'>Income Name:</label>
				<input
					type='text'
					id='income-name'
				/>
				<label htmlFor='income-amount'>Amount:</label>
				<input
					type='number'
					id='income-amount'
					onChange={(e) => {
						setTotalIncome(parseInt(e.target.value))
					}}
				/>
			</section>
			<section className='budget-category-creation'>
				<BudgetCategory />
				<button>Add Category</button>
			</section>
		</div>
	)
}
