import { BreezeButton } from '../../../../../components/shared/BreezeButton'
import { BreezeText } from '../../../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../../../components/shared/BreezeBox'
import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../../../services/providers/BudgetProvider'
import { usePostIncome } from '@/services/hooks/income/usePostIncome'
import dayjs from 'dayjs'

type IncomeItemsBoxProps = {
	setIncome: (amount: number) => void
}

/**
 * Component that displays the income items in a box. It is displayed in the EditBudgetPage component.
 * @param setIncome. The function to set the income after they have been changed.
 */
export const IncomeItemsBox = ({ setIncome }: IncomeItemsBoxProps) => {
	const { user } = useAuth0()
	const { budget, incomes, refetchIncomes } = useBudgetContext()
	const postMutation = usePostIncome({
		onSettled: () => {
			refetchIncomes()
		},
	})

	useEffect(() => {
		incomes && setIncome(incomes.reduce((acc, income) => acc + 1 * income.amount, 0))
	}, [incomes, setIncome])

	return (
		<BreezeBox
			title='Incomes'
			style={{
				padding: '0.5em',
				borderRadius: '0.5em',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Incomes'
			/>
			{incomes &&
				incomes.map((income) => (
					<IncomeItem
						key={income.id}
						incomeItem={income}
						refetchIncomes={refetchIncomes}
					/>
				))}

			<BreezeButton
				content='Add Income'
				onClick={() =>
					postMutation.mutate({
						income: {
							userId: user?.email ?? '',
							budgetId: budget.id,
							name: '',
							amount: 0,
							date: dayjs().format('YYYY-MM-DD'),
						},
					})
				}
			/>
		</BreezeBox>
	)
}
