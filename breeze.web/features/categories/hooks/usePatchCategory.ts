import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useCategories from './useCategories';
import { Category } from '../types';

interface PatchCategoryMutationProps {
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
