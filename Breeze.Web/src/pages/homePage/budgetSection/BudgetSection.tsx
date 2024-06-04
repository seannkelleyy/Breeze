import { useEffect, useState } from 'react'
import { getMonthAsString } from '../../../services/utils/GetMonth'
import { CategoryOverview } from './CategoryOverview'
import { Link } from 'react-router-dom'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { useBudgetContext } from '../../../services/contexts/BudgetContext'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'

/**
 * This is the category section view of that home page that gives a brief
 * overview of the current budget.
 */
export const BudgetSection = () => {
	const [budgetDate, setBudgetDate] = useState<Date>(new Date(Date.now()))
	const { budget, getBudgetForDate } = useBudgetContext()

	useEffect(() => {
		getBudgetForDate(budgetDate)
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

				<BreezeCard title='Budget Date'>
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
			<Link to={`/budget/${budgetDate.getFullYear()}/${budgetDate.getMonth()}`}>
				<BreezeButton
					text='Edit Budget'
					onClick={() => console.log('edit budget')}
				/>
			</Link>
			{budget.id === undefined ? (
				<BreezeText
					type='large'
					text='Loading...'
				/>
			) : (
				<BreezeCard title='Glance'>
					<BreezeText
						type='small-heading'
						text='This month at a glance'
					/>
					<p>{budget.id}</p>
					<BreezeText
						type='large'
						text={`Total income: ${budget.monthlyIncome ?? 0}`}
					/>
					<BreezeText
						type='large'
						text={`Total spent: ${budget.monthlyExpenses ?? 0}`}
					/>
					<BreezeText
						type='large'
						text={`Remaining: ${(budget.monthlyIncome ?? 0) - (budget.monthlyExpenses ?? 0)}`}
					/>
				</BreezeCard>
			)}
			<BreezeBox title='categories'>
				{budget.categories &&
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
