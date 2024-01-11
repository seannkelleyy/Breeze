import { useContext, useState } from 'react'
import { Category } from '../../../models/category'
import { BreezeInput } from '../../shared/BreezeInput'
import { BreezeText } from '../../shared/BreezeText'
import { BudgetContext } from '../../../services/budgetContext/BudgetContext'
import { BreezeBox } from '../../shared/BreezeBox'

type CategoryItemProps = {
	categoryItem: Category
}

export const CategoryItem = (props: CategoryItemProps) => {
	const { categoryItem } = props
	const budgetContext = useContext(BudgetContext)
	const { UpdateCategory } = budgetContext
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.amount)

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border)' }}
		>
			<BreezeText
				type='medium'
				text={categoryItem.name}
			/>
			<BreezeInput
				title='Income Amount'
				type='number'
				placeholder={categoryAmount.toString()}
				onChange={(e) => setCategoryAmount(e.target.value as unknown as number)}
				onBlur={() => {
					UpdateCategory(categoryItem)
				}}
			/>
		</BreezeBox>
	)
}
