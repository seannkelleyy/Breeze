import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useMutation } from 'react-query'
import { Category, useCategories } from '../../../services/hooks/CategoryServices'
import { DeleteButton } from '../../../components/shared/DeleteButton'

type CategoryItemProps = {
	categoryItem: Category
	onUpdate: (category: Category) => void
	onDelete: (category: Category) => void
}

export const CategoryItem = ({ categoryItem, onUpdate, onDelete }: CategoryItemProps) => {
	const { patchCategory, deleteCategory } = useCategories()
	const patchMutation = useMutation((category: Category) => patchCategory(category))
	const deleteMutation = useMutation((category: Category) => deleteCategory(category))
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.allocation)
	const [categoryName, setCategoryName] = useState<string>(categoryItem.name)

	const UpdateCategory = () => {
		const updatedCategory = { ...categoryItem, allocation: categoryAmount, name: categoryName }
		onUpdate(updatedCategory)
		patchMutation.mutate(updatedCategory)
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
			<DeleteButton
				onClick={() => {
					deleteMutation.mutate(categoryItem)
					onDelete(categoryItem)
				}}
			/>
		</BreezeBox>
	)
}
