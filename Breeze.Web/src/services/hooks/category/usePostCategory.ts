import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './categoryServices';

type PostCategoryProps = {
    category: Category;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for posting a category.
 * @param props.category: The category to post.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePostCategory = ({category, onSuccess, onSettled}: PostCategoryProps) => {
  const { postCategory } = useCategories();

  const mutationFn = useCallback(() => postCategory(category), [category, postCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};