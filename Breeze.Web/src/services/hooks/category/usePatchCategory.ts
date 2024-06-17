import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Category, useCategories } from './CategoryServices';

type PatchCategoryProps = {
    category: Category;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePatchCategory = ({category, onSuccess, onSettled}: PatchCategoryProps) => {
  const { patchCategory } = useCategories();

  const mutationFn = useCallback(() => patchCategory(category), [category, patchCategory]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};