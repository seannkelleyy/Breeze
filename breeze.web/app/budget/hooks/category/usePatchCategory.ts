import { createMutationHook } from '../createMutationHook';
import { useCategories } from './index';
import { Category } from '../../types/category';

export interface PatchCategoryMutationProps {
  category: Category;
}

/**
 * A hook for patching a category.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePatchCategory = createMutationHook(
  useCategories,
  ({ patchCategory }) =>
    ({ category }: PatchCategoryMutationProps) =>
      patchCategory(category),
);

export default usePatchCategory;
