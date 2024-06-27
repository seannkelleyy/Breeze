import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { DeleteButton } from '../../../components/shared/DeleteButton'
import { useDeleteIncome } from '@/services/hooks/income/useDeleteIncome'
import { usePatchIncome } from '@/services/hooks/income/usePatchIncome'
import { Income } from '@/services/hooks/income/incomeServices'

type IncomeItemProps = {
	incomeItem: Income
	refetchIncomes: () => void
}

/**
 * This component is a single income item. It is displayed in the IncomeItemsBox component.
 * @param incomeItem. The income object.
 * @param refetchIncomes. A function to refetch the incomes.
 */
export const IncomeItem = ({ incomeItem, refetchIncomes }: IncomeItemProps) => {
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)
	const [incomeName, setIncomeName] = useState<string>(incomeItem.name)
	const patchMutation = usePatchIncome({
		income: { ...incomeItem, amount: incomeAmount, name: incomeName },
		onSettled: () => {
			refetchIncomes()
		},
	})
	const deleteMutation = useDeleteIncome({
		income: incomeItem,
		onSettled: () => {
			refetchIncomes()
		},
	})

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%' }}
		>
			<BreezeInput
				title='Income Name'
				type='string'
				selectAllOnClick
				placeholder={incomeName}
				onChange={(e) => setIncomeName(e.target.value)}
				onBlur={() => patchMutation.mutate()}
				style={{
					textAlign: 'left',
					width: '75%',
				}}
			/>
			<BreezeInput
				title='Income Amount'
				type='number'
				selectAllOnClick
				placeholder={incomeAmount.toString()}
				onChange={(e) => setIncomeAmount(e.target.value as unknown as number)}
				onBlur={() => patchMutation.mutate()}
			/>
			<DeleteButton
				onClick={() => {
					deleteMutation.mutate()
				}}
			/>
		</BreezeBox>
	)
}
