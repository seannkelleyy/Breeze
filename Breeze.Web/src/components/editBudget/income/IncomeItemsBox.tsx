import { Income, emptyIncome } from '../../../models/income'
import { BreezeButton } from '../../shared/BreezeButton'
import { BreezeText } from '../../shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../shared/BreezeBox'
import { useEffect, useState } from 'react'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = ({ incomeItems }: IncomeItemsBoxProps) => {
	const [items, setItems] = useState<Income[]>(incomeItems)

	useEffect(() => {
		setItems(incomeItems)
	}, [incomeItems])

	const addIncome = () => {
		setItems([...items, emptyIncome])
	}
	return (
		<BreezeBox
			title='incomes'
			style={{
				border: 'var(--border) solid 2px',
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Incomes'
			/>
			{items.map((income) => (
				<IncomeItem
					key={income.id}
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
