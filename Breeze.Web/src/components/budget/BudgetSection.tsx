import { useState } from 'react'
import { getMonthAsString } from '../../utils/GetMonth'
import { FakeBudget } from '../../services/FakeData'
import CategoryItem from './CategoryItem'
import './budget.css'
// import { GetBudget } from '../../services/BudgetServices'
//import { Budget } from '../../models/budget'

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
		<div className='budget'>
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
					<h3>
						{getMonthAsString(budgetDate.getMonth())} {budgetDate.getFullYear()}
					</h3>
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
			<div>{!budget ? <button className='std-button'>Create Budget</button> : <button className='std-button'>Edit Budget</button>}</div>
			<div className='std-box'>
				<h2>This month at a glance</h2>
				<h3>Total income: ${budget?.monthlyIncome}</h3>
				<h3>Total spent: ${budget ? budget.monthlyIncome - budget.monthlySavings : 0}</h3>
				<h3>Total saved: ${budget?.monthlySavings}</h3>
			</div>
			<div className='categories'>
				{budget?.categories.map((category, index) => (
					<CategoryItem
						key={index}
						category={category}
					/>
				))}
			</div>
		</div>
	)
}

export default CategorySection
