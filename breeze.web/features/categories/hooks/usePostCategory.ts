import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useCategories from './useCategories';
import { CategoryInput } from '../types';

interface PostCategoryMutationProps {
  budgetId: string;
  userId: string;
  category: CategoryInput;
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
