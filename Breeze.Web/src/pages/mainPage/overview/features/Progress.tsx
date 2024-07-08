import { BreezeCard } from '@/components/shared/BreezeCard'
import { BreezeText } from '@/components/shared/BreezeText'
import { useBudgetContext } from '@/services/providers/BudgetProvider'
import dayjs from 'dayjs'

/**
 * This is a feature that calculates the user's progress towards their budget.
 */
export const Progress = () => {
	const { budget, totalSpent } = useBudgetContext()
	const numberOfDays = dayjs().daysInMonth()
	const totalBudget = budget && budget.monthlyIncome
	const dailyBudget = totalBudget / numberOfDays

	const calculateProgress = (todaysDate: number, dailyBudget: number, totalSpent: number, totalBudget: number) => {
		const projectedForToday = dailyBudget * todaysDate
		if (projectedForToday <= totalSpent + dailyBudget && projectedForToday >= totalSpent - dailyBudget) {
			return "You're right on track to meet your budget!"
		} else if (projectedForToday > totalSpent) {
			return "Great Work! You're on pace to be under budget!"
		} else if (totalSpent % 1 > totalBudget) {
			return "You've exceeded your budget. Try to cut back on spending."
		}
		return "You're spending more than you should. Try to cut back on spending."
	}

	if (!budget.id)
		return (
			<BreezeText
				text='No budget set. Set a budget to see your progress.'
				type='medium'
			/>
		)

	if (!budget.monthlyIncome)
		return (
			<BreezeText
				text='Create a budget to see your progress.'
				type='medium'
			/>
		)

	return (
		<BreezeCard title='Progress'>
			<BreezeText
				text={calculateProgress(new Date().getDate(), dailyBudget, totalSpent, totalBudget)}
				type='medium'
			/>
		</BreezeCard>
	)
}
