import { useEffect, useState } from 'react'
import { GetBudget } from '../../services/BudgetServices'
import { getMonthAsString } from '../../utils/GetMonth'
import { Budget } from '../../models/budget'
import CategoryItem from './CategoryItem'
import './budget.css'

const CategorySection = () => {
	const [budgetDate, setBudgetDate] = useState<Date>(new Date(Date.now()))
	const [budget, setBudget] = useState<Budget>()

	useEffect(() => {
		const fetchBudget = async () => {
			const result = await GetBudget(budgetDate)
			setBudget(result)
		}
		fetchBudget()
	}, [budgetDate])

	const changeBudgetDate = (date: Date, direction: boolean) => {
		const newDate = new Date(date)
		if (direction) {
			newDate.setMonth(newDate.getMonth() + 1)
		} else {
			newDate.setMonth(newDate.getMonth() - 1)
		}
		return newDate
	}

	return (
		<>
			<div className='budget-date'>
				<button
					className='change-budget-button'
					onClick={() => setBudgetDate(changeBudgetDate(budgetDate, false))}
				>
					{'<'}
				</button>
				<div className='budget-date-box'>
					<h2>
						{getMonthAsString(budgetDate.getMonth())} {budgetDate.getFullYear()}
					</h2>
				</div>
				<button
					className='change-budget-button'
					onClick={() => setBudgetDate(changeBudgetDate(budgetDate, true))}
				>
					{'>'}
				</button>
			</div>
			<div className='budget'>
				{budget?.categories.map((category, index) => (
					<CategoryItem
						key={index}
						category={category}
					/>
				))}
			</div>
		</>
	)
}

export default CategorySection
