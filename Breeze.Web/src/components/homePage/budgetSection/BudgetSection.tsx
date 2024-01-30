import { useState } from 'react'
import { getMonthAsString } from '../../../services/utils/GetMonth'
import { CategoryOverview } from './CategoryOverview'
import { Link } from 'react-router-dom'
import { BreezeButton } from '../../shared/BreezeButton'
import { useBudget } from '../../../services/budgetContext/BudgetContext'
import { BreezeCard } from '../../shared/BreezeCard'
import { BreezeBox } from '../../shared/BreezeBox'
import { BreezeText } from '../../shared/BreezeText'

/**
 * This is the category section view of that home page that gives a brief
 * overview of the current budget.
 */
export const BudgetSection = () => {
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
		<BreezeBox title='budget'>
			<BreezeBox
				title='budget-date'
				direction='row'
			>
				<BreezeButton
					text={
						<img
							src='./arrow-left.svg'
							alt='arrow-left'
						/>
					}
					onClick={() => setBudgetDate(changeBudgetDate(budgetDate, false))}
				/>

				<BreezeCard title='Budegt Date'>
					<BreezeText
						type='large'
						text={`${getMonthAsString(budgetDate.getMonth())} ${budgetDate.getFullYear()}`}
					/>
				</BreezeCard>
				<BreezeButton
					text={
						<img
							src='./arrow-right.svg'
							alt='arrow-right'
						/>
					}
					onClick={() => setBudgetDate(changeBudgetDate(budgetDate, true))}
				/>
			</BreezeBox>
			<Link to={`/budget/${budgetDate.getFullYear()}/${getMonthAsString(budgetDate.getMonth())}`}>
				<BreezeButton
					text='Edit Budget'
					onClick={() => console.log('edit budget')}
				/>
			</Link>
			<BreezeCard title='Glance'>
				<BreezeText
					type='small-heading'
					text='This month at a glance'
				/>
				<BreezeText
					type='large'
					text={`Total income: ${budget ? budget.monthlyIncome : 0}`}
				/>
				<BreezeText
					type='large'
					text={`Total spent: ${budget ? budget.monthlyIncome - budget.monthlySavings : 0}`}
				/>
				<BreezeText
					type='large'
					text={`Total saved: ${budget ? budget.monthlySavings : 0}`}
				/>
			</BreezeCard>
			<BreezeBox title='categories'>
				{budget &&
					budget.categories.map((category, index) => (
						<CategoryOverview
							key={index}
							category={category}
						/>
					))}
			</BreezeBox>
		</BreezeBox>
	)
}
