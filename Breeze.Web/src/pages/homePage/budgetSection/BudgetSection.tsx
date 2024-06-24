import { useEffect, useState } from 'react'
import { CategoryOverview } from './CategoryOverview'
import { Link } from 'react-router-dom'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'
import { useDateContext } from '../../../services/providers/DateProvider'
import { Budget } from '@/services/hooks/budget/BudgetServices'

/**
 * This is the category section view of that home page that gives a brief
 * overview of the current budget.
 */
export const BudgetSection = () => {
	const { date, getMonthAsString } = useDateContext()
	const [budgetDate, setBudgetDate] = useState<Date>(date)
	const { budget, totalSpent, categories, getBudgetForDate, refetchCategories } = useBudgetContext()
	const [response, setResponse] = useState<{ status: number; budget?: Budget; error?: string }>()

	useEffect(() => {
		const fetchBudget = async () => {
			try {
				const response = await getBudgetForDate(budgetDate.getFullYear(), budgetDate.getMonth())
				setResponse(response)
			} catch (error) {
				console.error('An error occurred while fetching the budget:', error)
			}
		}

		fetchBudget()
		refetchCategories()
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
					content={
						<img
							className='svg-icon'
							src='./arrow-left.svg'
							alt='arrow-left'
						/>
					}
					onClick={() => setBudgetDate(changeBudgetDate(budgetDate, false))}
				/>
				<BreezeText
					type='large'
					style={{
						textAlign: 'center',
						background: 'var(--color-card-background)',
						boxShadow: 'var(--shadow-box-shadow)',
						borderRadius: '0.75rem',
						padding: '.5em 1em',
					}}
					text={`${getMonthAsString(budgetDate.getMonth())} ${budgetDate.getFullYear()}`}
				/>
				<BreezeButton
					content={
						<img
							className='svg-icon'
							src='./arrow-right.svg'
							alt='arrow-right'
						/>
					}
					onClick={() => setBudgetDate(changeBudgetDate(budgetDate, true))}
				/>
			</BreezeBox>
			<Link to={`/budget/${budgetDate.getFullYear()}/${budgetDate.getMonth()}`}>
				<BreezeButton content='Edit Budget' />
			</Link>
			{budget.id === undefined ? (
				<BreezeText
					type='large'
					text='Loading...'
				/>
			) : (response?.status ?? 0) > 300 ? (
				<BreezeText
					type='large'
					text='No budget found'
					style={{
						width: '80%',
						textAlign: 'center',
					}}
				/>
			) : (
				<BreezeCard title='Glance'>
					<BreezeText
						type='small-heading'
						text='This month at a glance'
					/>
					<BreezeText
						type='large'
						text={`Total income: $${budget.monthlyIncome ?? 0}`}
					/>
					<BreezeText
						type='large'
						text={`Total spent: $${totalSpent ?? 0}`}
					/>
					<BreezeText
						type='large'
						text={`Remaining: $${(budget.monthlyIncome ?? 0) - (totalSpent ?? 0)}`}
					/>
				</BreezeCard>
			)}
			<BreezeBox
				title='Categories'
				style={{
					width: '100%',
				}}
			>
				{categories &&
					categories.map((category, index) => (
						<CategoryOverview
							key={index}
							category={category}
						/>
					))}
			</BreezeBox>
		</BreezeBox>
	)
}
