import { useContext, useState } from 'react'
import { Category } from '../../../models/category'
import { BreezeInput } from '../../shared/BreezeInput'
import { BudgetContext } from '../../../services/budgetContext/BudgetContext'
import { BreezeBox } from '../../shared/BreezeBox'

type CategoryItemProps = {
	categoryItem: Category
}

export const CategoryItem = ({ categoryItem }: CategoryItemProps) => {
	const budgetContext = useContext(BudgetContext)
	const { UpdateCategory } = budgetContext
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.amount)
	const [categoryName, setCategoryName] = useState<string>(categoryItem.name)

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border)' }}
		>
			<BreezeInput
				title='Category Name'
				type='string'
				placeholder={categoryName}
				onChange={(e) => setCategoryName(e.target.value)}
				onBlur={() => {
					UpdateCategory(categoryItem)
				}}
				style={{
					textAlign: 'left',
					width: '75%',
				}}
			/>
			<BreezeInput
				title='Category Amount'
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
