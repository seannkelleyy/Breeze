import { useState } from 'react'
import { Category } from '../../models/category'
import { useBudget } from '../../services/budgetContext/BudgetContext'
import { BreezeInput } from '../shared/BreezeInput'
import { BreezeText } from '../shared/BreezeText'

type CategoryItemProps = {
	categoryItem: Category
}

export const CategoryItem = (props: CategoryItemProps) => {
	const { categoryItem } = props
	const budgetContext = useBudget()
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.amount)

	return (
		<section className='budget-item'>
			<BreezeText text={categoryItem.name} />
			<BreezeInput
				title='Income Amount'
				type='number'
				placeholder={categoryAmount.toString()}
				onChange={(e) => setCategoryAmount(e.target.value as unknown as number)}
				onBlur={() => {
					budgetContext.updateCategory(categoryItem)
				}}
			/>
		</section>
	)
}
