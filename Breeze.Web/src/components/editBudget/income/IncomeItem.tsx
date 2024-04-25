import { useState } from 'react'
import { Income } from '../../../services/models/income'
import { BreezeInput } from '../../shared/BreezeInput'
import { BreezeBox } from '../../shared/BreezeBox'
import { useMutation } from 'react-query'
import { putIncome } from '../../../services/hooks/IncomeServices'

type IncomeItemProps = {
	incomeItem: Income
}

export const IncomeItem = ({ incomeItem }: IncomeItemProps) => {
	const mutation = useMutation((income: Income) => putIncome(income))
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)
	const [incomeName, setIncomeName] = useState<string>(incomeItem.name)

	const UpdateIncome = () => {
		mutation.mutate(incomeItem)
	}

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border)' }}
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
