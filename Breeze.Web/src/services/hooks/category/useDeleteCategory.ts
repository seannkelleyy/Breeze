import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './categoryServices';

type DeleteCategoryProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting a category.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type DeleteCategoryMutationProps = {
   category: Category
}

/**
 * Mutation function for deleting a category.
 * @param props.category: The category to delete.
 */

export const useDeleteCategory = ({onSuccess, onSettled}: DeleteCategoryProps) => {
  const { deleteCategory } = useCategories();

  const mutationFn = useCallback(({category} : DeleteCategoryMutationProps) => deleteCategory(category), [ deleteCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};