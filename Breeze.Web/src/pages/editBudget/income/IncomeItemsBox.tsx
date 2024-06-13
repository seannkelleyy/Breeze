import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect } from 'react'
import { Income, useIncomes } from '../../../services/hooks/IncomeServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { useMutation } from 'react-query'

type IncomeItemsBoxProps = {
	setIncome: (amount: number) => void
}

export const IncomeItemsBox = ({ setIncome }: IncomeItemsBoxProps) => {
	const { user } = useAuth0()
	const { postIncome } = useIncomes()
	const { budget, incomes, refetchBudget, refetchIncomes } = useBudgetContext()
	const postMutation = useMutation(postIncome, {
		onSettled: () => {
			refetchIncomes()
		},
	})

	useEffect(() => {
		setIncome(incomes.reduce((acc, income) => acc + 1 * income.amount, 0))
	}, [incomes, setIncome])

	const addIncome = async () => {
		if (budget.id === 0 || budget.id === undefined || budget.id === null || isNaN(budget.id)) {
			await refetchBudget()
		}
		const newIncome: Income = {
			userId: user?.email ?? '',
			budgetId: budget.id,
			name: '',
			amount: 0,
			year: new Date(Date.now()).getFullYear(),
			month: new Date(Date.now()).getMonth() + 1,
			day: new Date(Date.now()).getDate(),
		}
		postMutation.mutate(newIncome)
	}

	return (
		<BreezeBox
			title='incomes'
			style={{
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Incomes'
			/>
			{incomes.map((income) => (
				<IncomeItem
					key={income.id}
					incomeItem={income}
					refetchIncomes={refetchIncomes}
				/>
			))}

			<BreezeButton
				content='Add Income'
				onClick={addIncome}
			/>
		</BreezeBox>
	)
}
