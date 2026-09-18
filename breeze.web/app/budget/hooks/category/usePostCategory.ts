import { createMutationHook } from '../createMutationHook';
import { useCategories } from './index';
import { Category } from '../../types/category';

export interface PostCategoryMutationProps {
  budgetId: string;
  userId: string;
  category: Omit<
    Category,
    'id' | 'userId' | 'budgetId' | 'currentSpend' | 'createdAt' | 'updatedAt'
  >;
}

/**
 * A hook for posting a category.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePostCategory = createMutationHook(
  useCategories,
  ({ postCategory }) =>
    ({ budgetId, userId, category }: PostCategoryMutationProps) =>
      postCategory(budgetId, userId, category),
);

export default usePostCategory;
