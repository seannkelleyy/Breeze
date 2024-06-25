import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './categoryServicess';

type PatchCategoryProps = {
    category: Category;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for patching a category.
 * @param props.category: The category to patch.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePatchCategory = ({category, onSuccess, onSettled}: PatchCategoryProps) => {
  const { patchCategory } = useCategories();

  const mutationFn = useCallback(() => patchCategory(category), [category, patchCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};