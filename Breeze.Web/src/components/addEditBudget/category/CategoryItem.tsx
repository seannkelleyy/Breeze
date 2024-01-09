import { useContext, useState } from 'react'
import { Category } from '../../../models/category'
import { BreezeInput } from '../../shared/BreezeInput'
import { BreezeText } from '../../shared/BreezeText'
import { BudgetContext } from '../../../services/budgetContext/BudgetContext'

type CategoryItemProps = {
	categoryItem: Category
}

export const CategoryItem = (props: CategoryItemProps) => {
	const { categoryItem } = props
	const budgetContext = useContext(BudgetContext)
	const { UpdateCategory } = budgetContext
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
					UpdateCategory(categoryItem)
				}}
			/>
		</section>
	)
}
