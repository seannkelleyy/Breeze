import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useMutation } from 'react-query'
import { Income, useIncomes } from '../../../services/hooks/IncomeServices'
import { DeleteButton } from '../../../components/shared/DeleteButton'

type IncomeItemProps = {
	incomeItem: Income
	onUpdate: (income: Income) => void
	onDelete: (income: Income) => void
}

export const IncomeItem = ({ incomeItem, onUpdate, onDelete }: IncomeItemProps) => {
	const { patchIncome, deleteIncome } = useIncomes()
	const patchMutation = useMutation((income: Income) => patchIncome(income))
	const deleteMutation = useMutation((income: Income) => deleteIncome(income))
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)
	const [incomeName, setIncomeName] = useState<string>(incomeItem.name)

	const UpdateIncome = () => {
		const updatedIncome = { ...incomeItem, amount: incomeAmount, name: incomeName }
		onUpdate(updatedIncome)
		patchMutation.mutate(updatedIncome)
	}

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%' }}
		>
			<BreezeInput
				title='Income Name'
				type='string'
				placeholder={incomeName}
				onChange={(e) => setIncomeName(e.target.value)}
				onBlur={() => {
					UpdateIncome()
				}}
				style={{
					textAlign: 'left',
					width: '75%',
				}}
			/>
			<BreezeInput
				title='Income Amount'
				type='number'
				placeholder={incomeAmount.toString()}
				onChange={(e) => setIncomeAmount(e.target.value as unknown as number)}
				onBlur={() => {
					UpdateIncome()
				}}
			/>
			<DeleteButton
				onClick={() => {
					deleteMutation.mutate(incomeItem)
					onDelete(incomeItem)
				}}
			/>
		</BreezeBox>
	)
}
