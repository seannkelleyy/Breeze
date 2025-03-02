import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './categoryServices';

type PostCategoryProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for posting a category.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type PostCategoryMutationProps = {
   category: Category
}

/**
 * Mutation function for posting a category.
 * @param props.category: The category to post.
 */
 
export const usePostCategory = ({ onSuccess, onSettled}: PostCategoryProps) => {
  const { postCategory } = useCategories();

  const mutationFn = useCallback(({category} : PostCategoryMutationProps) => postCategory(category), [ postCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};