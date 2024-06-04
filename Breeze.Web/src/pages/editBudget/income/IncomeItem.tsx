import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useMutation } from 'react-query'
import { Income, useIncomes } from '../../../services/hooks/IncomeServices'

type IncomeItemProps = {
	incomeItem: Income
	onUpdate: (income: Income) => void
}

export const IncomeItem = ({ incomeItem, onUpdate }: IncomeItemProps) => {
	const { patchIncome } = useIncomes()
	const mutation = useMutation((income: Income) => patchIncome(income))
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)
	const [incomeName, setIncomeName] = useState<string>(incomeItem.name)

	const UpdateIncome = () => {
		onUpdate({ ...incomeItem, amount: incomeAmount, name: incomeName })
		mutation.mutate(incomeItem)
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
		</BreezeBox>
	)
}
