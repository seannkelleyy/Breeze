import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useCategories from './useCategories';
import { Category } from '../types';

interface DeleteCategoryMutationProps {
  category: Category;
}

/**
 * A hook for deleting a category.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const useDeleteCategory = createMutationHook(
  useCategories,
  ({ deleteCategory }) =>
    ({ category }: DeleteCategoryMutationProps) =>
      deleteCategory(category.id),
);

export default useDeleteCategory;
