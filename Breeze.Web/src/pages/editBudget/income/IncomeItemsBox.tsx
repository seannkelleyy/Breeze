import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect, useState } from 'react'
import { EmptyIncome, Income } from '../../../services/hooks/IncomeServices'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = ({ incomeItems }: IncomeItemsBoxProps) => {
	const [items, setItems] = useState<Income[]>(incomeItems)

	useEffect(() => {
		setItems(incomeItems)
	}, [incomeItems])

	const addIncome = () => {
		setItems([...items, EmptyIncome])
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
			{items.map((income, index) => (
				<IncomeItem
					key={index}
					incomeItem={income}
				/>
			))}

			<BreezeButton
				text='Add Income'
				onClick={addIncome}
			/>
		</BreezeBox>
	)
}
