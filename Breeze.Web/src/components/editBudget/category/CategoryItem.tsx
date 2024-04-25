import { useState } from 'react'
import { Category } from '../../../services/models/category'
import { BreezeInput } from '../../shared/BreezeInput'
import { BreezeBox } from '../../shared/BreezeBox'
import { putCategory } from '../../../services/hooks/CategoryServices'
import { useMutation } from 'react-query'

type CategoryItemProps = {
	categoryItem: Category
}

export const CategoryItem = ({ categoryItem }: CategoryItemProps) => {
	const mutation = useMutation((category: Category) => putCategory(category))
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.allocation)
	const [categoryName, setCategoryName] = useState<string>(categoryItem.name)

	const UpdateCategory = () => {
		mutation.mutate(categoryItem)
	}
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
					UpdateCategory()
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
					UpdateCategory()
				}}
			/>
		</BreezeBox>
	)
}
