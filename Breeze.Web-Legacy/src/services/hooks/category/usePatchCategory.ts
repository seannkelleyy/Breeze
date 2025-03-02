import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './categoryServices';

type PatchCategoryProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for patching a category.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type PatchCategoryMutationProps = {
   category: Category
}

/**
 * Mutation function for patching a category.
 * @param props.category: The category to post.
 */

export const usePatchCategory = ({ onSuccess, onSettled}: PatchCategoryProps) => {
  const { patchCategory } = useCategories();

  const mutationFn = useCallback(({category} : PatchCategoryMutationProps) => patchCategory(category), [ patchCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};