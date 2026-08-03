import { useCallback, useMemo } from 'react';

import {
  CREATE_EXPENSE_CATEGORY,
  DELETE_EXPENSE_CATEGORY,
  GET_CATEGORIES,
  UPDATE_EXPENSE_CATEGORY,
} from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Category } from '../../types/category';

/**
 * A hook for fetching and mutating category data via GraphQL.
 */
const useCategories = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getCategories = useCallback(
    async (budgetId: string): Promise<Category[]> => {
      const resp = await request<{ expenseCategories: Category[] }>(GET_CATEGORIES, {
        budgetId,
      });
      return resp?.expenseCategories ?? [];
    },
    [request],
  );

  const postCategory = useCallback(
    async (
      budgetId: string,
      _userId: string,
      category: Omit<
        Category,
        'id' | 'userId' | 'budgetId' | 'currentSpend' | 'createdAt' | 'updatedAt'
      >,
    ): Promise<string> => {
      const input = {
        userId,
        budgetId,
        name: category.name,
        allocation: category.allocation,
        currentSpend: '0',
      };
      const resp = await request<{ createExpenseCategory: Category }>(CREATE_EXPENSE_CATEGORY, {
        input,
      });
      return resp.createExpenseCategory.id;
    },
    [request, userId],
  );

  const patchCategory = useCallback(
    async (category: Category): Promise<string> => {
      const input = {
        id: category.id,
        name: category.name,
        allocation: category.allocation,
        currentSpend: category.currentSpend,
      };
      const resp = await request<{ updateExpenseCategory: Category }>(UPDATE_EXPENSE_CATEGORY, {
        input,
      });
      return resp.updateExpenseCategory.id;
    },
    [request],
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      await request<{ deleteExpenseCategory: boolean }>(DELETE_EXPENSE_CATEGORY, {
        id: categoryId,
      });
      return true;
    },
    [request],
  );

  return useMemo(
    () => ({ getCategories, postCategory, patchCategory, deleteCategory }),
    [deleteCategory, getCategories, patchCategory, postCategory],
  );
};

export default useCategories;
