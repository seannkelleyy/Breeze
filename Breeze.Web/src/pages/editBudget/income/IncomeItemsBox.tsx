import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { usePostIncome } from '@/services/hooks/income/usePostIncome'

type IncomeItemsBoxProps = {
	setIncome: (amount: number) => void
}

export const IncomeItemsBox = ({ setIncome }: IncomeItemsBoxProps) => {
	const { user } = useAuth0()
	const { budget, incomes, refetchIncomes } = useBudgetContext()
	const postMutation = usePostIncome({
		income: {
			userId: user?.email ?? '',
			budgetId: budget.id,
			name: '',
			amount: 0,
			year: new Date(Date.now()).getFullYear(),
			month: new Date(Date.now()).getMonth() + 1,
			day: new Date(Date.now()).getDate(),
		},
		onSettled: () => {
			refetchIncomes()
		},
	})

	useEffect(() => {
		setIncome(incomes.reduce((acc, income) => acc + 1 * income.amount, 0))
	}, [incomes, setIncome])

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
				onClick={() => postMutation.mutate()}
			/>
		</BreezeBox>
	)
}
