import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { DeleteButton } from '../../../components/shared/DeleteButton'
import { useDeleteCategory } from '@/services/hooks/category/useDeleteCategory'
import { usePatchCategory } from '@/services/hooks/category/usePatchCategory'
import { Category } from '@/services/hooks/category/categoryServices'

type CategoryItemProps = {
	categoryItem: Category
	refetchCategories: () => void
}

/**
 * This component is a single category item. It is displayed in the CategoryItemsBox component.
 * @param categoryItem. The category object.
 * @param refetchCategories. A function to refetch the categories.
 */
export const CategoryItem = ({ categoryItem, refetchCategories }: CategoryItemProps) => {
	const [categoryAmount, setCategoryAmount] = useState<number>(categoryItem.allocation)
	const [categoryName, setCategoryName] = useState<string>(categoryItem.name)
	const patchMutation = usePatchCategory({
		category: { ...categoryItem, allocation: categoryAmount, name: categoryName },
		onSettled: () => {
			refetchCategories()
		},
	})
	const deleteMutation = useDeleteCategory({
		category: categoryItem,
		onSettled: () => {
			refetchCategories()
		},
	})

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%' }}
		>
			<BreezeInput
				title='Category Name'
				type='string'
				selectAllOnClick
				placeholder={categoryName}
				onChange={(e) => setCategoryName(e.target.value)}
				onBlur={() => patchMutation.mutate()}
				style={{
					textAlign: 'left',
					width: '75%',
				}}
			/>
			<BreezeInput
				title='Category Amount'
				type='number'
				selectAllOnClick
				placeholder={categoryAmount.toString()}
				onChange={(e) => setCategoryAmount(e.target.value as unknown as number)}
				onBlur={() => patchMutation.mutate()}
			/>
			<DeleteButton
				onClick={() => {
					deleteMutation.mutate()
				}}
			/>
		</BreezeBox>
	)
}
