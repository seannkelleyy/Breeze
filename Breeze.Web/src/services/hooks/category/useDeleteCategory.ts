import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from '../httpServices/CategoryServices';

type DeleteCategoryProps = {
    category: Category;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const useDeleteCategory = ({category, onSuccess, onSettled}: DeleteCategoryProps) => {
  const { deleteCategory } = useCategories();

  const mutationFn = useCallback(() => deleteCategory(category), [category, deleteCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};