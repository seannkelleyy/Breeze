import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'
import { useState } from 'react'
import { clamp } from '../../lib/plannerMath'
import { usePlanner } from './index'

const usePlannerRetirementInputs = () => {
	const {
		isSignedIn,
		plannerDesiredInvestmentAmount,
		setPlannerDesiredInvestmentAmount,
		plannerMonthlyExpenses,
		setPlannerMonthlyExpenses,
		plannerRetirementMethod,
		setPlannerRetirementMethod,
		plannerFireLifestyleIndex,
		setPlannerFireLifestyleIndex,
	} = useCurrentUser()
	const { getLatestBudgetMonthlyExpenses } = usePlanner()
	const [isRefreshingExpenses, setIsRefreshingExpenses] = useState(false)

	const refreshMonthlyExpenses = async () => {
		if (!isSignedIn) {
			return
		}

		try {
			setIsRefreshingExpenses(true)
			const latestExpenses = await getLatestBudgetMonthlyExpenses()
			setPlannerMonthlyExpenses(clamp(latestExpenses))
		} finally {
			setIsRefreshingExpenses(false)
		}
	}

	return {
		desiredInvestmentAmount: plannerDesiredInvestmentAmount,
		setDesiredInvestmentAmount: setPlannerDesiredInvestmentAmount,
		monthlyExpenses: plannerMonthlyExpenses,
		setMonthlyExpenses: setPlannerMonthlyExpenses,
		retirementMethod: plannerRetirementMethod,
		setRetirementMethod: setPlannerRetirementMethod,
		fireLifestyleIndex: plannerFireLifestyleIndex,
		setFireLifestyleIndex: setPlannerFireLifestyleIndex,
		isRefreshingExpenses,
		refreshMonthlyExpenses,
	}
}

export default usePlannerRetirementInputs

