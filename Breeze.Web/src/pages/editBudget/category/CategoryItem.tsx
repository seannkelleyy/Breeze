import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useMutation } from 'react-query'
import { Category, useCategories } from '../../../services/hooks/CategoryServices'

type CategoryItemProps = {
	categoryItem: Category
}

export const CategoryItem = ({ categoryItem }: CategoryItemProps) => {
	const { patchCategory } = useCategories()
	const mutation = useMutation((category: Category) => patchCategory(category))
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.allocation)
	const [categoryName, setCategoryName] = useState<string>(categoryItem.name)

	const UpdateCategory = () => {
		mutation.mutate(categoryItem)
	}
	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%' }}
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
