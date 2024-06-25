import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './categoryServicess';

type DeleteCategoryProps = {
    category: Category;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting a category.
 * @param props.category: The category to delete.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const useDeleteCategory = ({category, onSuccess, onSettled}: DeleteCategoryProps) => {
  const { deleteCategory } = useCategories();

  const mutationFn = useCallback(() => deleteCategory(category), [category, deleteCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};