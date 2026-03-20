import { useCallback } from 'react'

import { useMutation } from '@tanstack/react-query'
import { Category } from '../../types/category'
import { useCategories } from './index'

interface PatchCategoryProps {
	onSuccess?: () => void
	onSettled?: () => void
}

/**
 * A hook for patching a category.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PatchCategoryMutationProps {
	category: Category
}

/**
 * Mutation function for patching a category.
 * @param props.category: The category to patch.
 */

const usePatchCategory = ({ onSuccess, onSettled }: PatchCategoryProps) => {
	const { patchCategory } = useCategories()

	const mutationFn = useCallback(({ category }: PatchCategoryMutationProps) => patchCategory(category), [patchCategory])

	return useMutation({
		mutationFn,
		onSuccess: onSuccess,
		onSettled: onSettled,
	})
}

export default usePatchCategory

