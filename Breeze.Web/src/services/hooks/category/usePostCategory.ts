import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from '../httpServices/CategoryServices';

type PostCategoryProps = {
    category: Category;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePostCategory = ({category, onSuccess, onSettled}: PostCategoryProps) => {
  const { postCategory } = useCategories();

  const mutationFn = useCallback(() => postCategory(category), [category, postCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};