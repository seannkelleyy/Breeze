import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Category } from '../../types/category';
import { useCategories } from './index';

interface DeleteCategoryProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for deleting a category.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface DeleteCategoryMutationProps {
  category: Category;
}

/**
 * Mutation function for deleting a category.
 * @param props.category: The category to delete.
 */

const useDeleteCategory = ({ onSuccess, onSettled }: DeleteCategoryProps) => {
  const { deleteCategory } = useCategories();

  const mutationFn = useCallback(
    ({ category }: DeleteCategoryMutationProps) => deleteCategory(category),
    [deleteCategory],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default useDeleteCategory;
