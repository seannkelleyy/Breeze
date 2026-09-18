import { createMutationHook } from '../createMutationHook';
import { useCategories } from './index';
import { Category } from '../../types/category';

export interface DeleteCategoryMutationProps {
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
