import { useBudgetContext } from '../../../services/contexts/BudgetContext'
import { getNumberOfDaysInMonth } from '../../../services/utils/GetMonth'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeText } from '../../../components/shared/BreezeText'

/**
 * This is a future feature that will calculate the user's progress towards their budget.
 */
export const Progress = () => {
	const { budget } = useBudgetContext()
	const totalSpent = budget.monthlyExpenses
	const totalBudget = budget.monthlyIncome
	const numberOfDays = getNumberOfDaysInMonth(new Date().getMonth(), new Date().getFullYear())
	const dailyBudget = totalBudget / numberOfDays

	const calculateProgress = (todaysDate: number, dailyBudget: number, totalSpent: number, totalBudget: number) => {
		const projectedForToday = dailyBudget * todaysDate
		if (projectedForToday <= totalSpent + dailyBudget && projectedForToday >= totalSpent - dailyBudget) {
			return "You're right on track to meet your budget!"
		} else if (projectedForToday > totalSpent) {
			return "Great Work! You're running under budget!"
		} else if (totalSpent % 1 > totalBudget) {
			return "You've exceeded your budget. Try to cut back on spending."
		}
		return "You're spending more than you should. Try to cut back on spending."
	}

	return (
		<BreezeCard
			title='Progress'
			style={{
				width: '80%',
			}}
		>
			<BreezeText
				text={calculateProgress(new Date().getDate(), dailyBudget, totalSpent, totalBudget)}
				type='medium'
			/>
		</BreezeCard>
	)
}
