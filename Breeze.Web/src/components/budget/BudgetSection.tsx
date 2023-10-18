import { useState } from 'react'
// import { GetBudget } from '../../services/BudgetServices'
import { getMonthAsString } from '../../utils/GetMonth'
//import { Budget } from '../../models/budget'
import CategoryItem from './CategoryItem'
import './budget.css'
import { FakeBudget } from '../../services/FakeData'

const CategorySection = () => {
	const [budgetDate, setBudgetDate] = useState<Date>(new Date(Date.now()))
	const budget = FakeBudget
	// const [budget, setBudget] = useState<Budget>()

	// useEffect(() => {
	// 	const fetchBudget = async () => {
	// 		const result = await GetBudget(budgetDate)
	// 		setBudget(result)
	// 		console.log(result)
	// 	}
	// 	fetchBudget()
	// }, [budgetDate])

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
					<img
						src='./arrow-left.svg'
						alt='arrow-left'
					/>
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
					<img
						src='./arrow-right.svg'
						alt='arrow-right'
					/>
				</button>
			</div>
			<div className='budget-highlight'>
				<h2>Total spent this month: ${budget ? budget.monthlyIncome - budget.monthlySavings : 0}</h2>
				<h2>Total saved this month: ${budget?.monthlySavings}</h2>
				<h2>Total income this month: ${budget?.monthlyIncome}</h2>
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
