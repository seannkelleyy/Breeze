import { useState } from 'react'
import { getMonthAsString } from '../../../utils/GetMonth'
import { CategoryOverview } from './CategoryOverview'
import { Link } from 'react-router-dom'
import './budget.css'
import { months } from '../../../utils/months'
import { BreezeButton } from '../../shared/BreezeButton'
import { useBudget } from '../../../services/budgetContext/BudgetContext'

const CategorySection = () => {
	const [budgetDate, setBudgetDate] = useState<Date>(new Date(Date.now()))
	const budget = useBudget(budgetDate)

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
			<Link to={`/Breeze/Budget/${budgetDate.getFullYear()}/${months[budgetDate.getMonth()]}`}>
				<BreezeButton
					text='Edit Budget'
					onClick={() => console.log('edit budget')}
				/>
			</Link>
			<div className='std-box'>
				<h2>This month at a glance</h2>
				<h3>Total income: ${budget ? budget.monthlyIncome : 0}</h3>
				<h3>Total spent: ${budget ? budget.monthlyIncome - budget.monthlySavings : 0}</h3>
				<h3>Total saved: ${budget ? budget.monthlySavings : 0}</h3>
				<h3>Check : {budget.id}</h3>
			</div>
			<div className='categories'>
				{budget &&
					budget.categories.map((category, index) => (
						<CategoryOverview
							key={index}
							category={category}
						/>
					))}
			</div>
		</div>
	)
}

export default CategorySection
