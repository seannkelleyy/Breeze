import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Category } from '../../types/category';
import { useCategories } from './index';

interface PostCategoryProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for posting a category.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PostCategoryMutationProps {
  budgetId: string;
  userId: string;
  category: Omit<
    Category,
    'id' | 'userId' | 'budgetId' | 'currentSpend' | 'createdAt' | 'updatedAt'
  >;
}

/**
 * Mutation function for posting a category.
 * @param props.budgetId: The budget ID.
 * @param props.userId: The user ID.
 * @param props.category: The category to post.
 */

const usePostCategory = ({ onSuccess, onSettled }: PostCategoryProps) => {
  const { postCategory } = useCategories();

  const mutationFn = useCallback(
    ({ budgetId, userId, category }: PostCategoryMutationProps) =>
      postCategory(budgetId, userId, category),
    [postCategory],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default usePostCategory;
