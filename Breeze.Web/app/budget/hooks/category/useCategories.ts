import { useCallback, useMemo } from 'react';

import {
  CREATE_EXPENSE_CATEGORY,
  DELETE_EXPENSE_CATEGORY,
  GET_CATEGORIES,
  UPDATE_EXPENSE_CATEGORY,
} from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { Category } from '../../types/category';

/**
 * A hook for fetching and mutating category data via GraphQL.
 */
const useCategories = () => {
  const { request } = useGraphql();

  const getCategories = useCallback(
    async (budgetId: number): Promise<Category[]> => {
      const resp = await request<{ expenseCategories: Category[] }>(GET_CATEGORIES, {
        budgetId,
      } as unknown as Record<string, unknown>);
      return resp?.expenseCategories ?? [];
    },
    [request],
  );

  const postCategory = useCallback(
    async (category: Category): Promise<number> => {
      const input = {
        userId: category.userId,
        budgetId: category.budgetId,
        name: category.name,
        allocation: String(category.allocation ?? 0),
        currentSpend: String(category.currentSpend ?? 0),
      };
      const resp = await request<{ createExpenseCategory: { id: number } }>(
        CREATE_EXPENSE_CATEGORY,
        { input } as unknown as Record<string, unknown>,
      );
      return resp.createExpenseCategory.id;
    },
    [request],
  );

  const patchCategory = useCallback(
    async (category: Category): Promise<number> => {
      const input = {
        id: category.id,
        name: category.name,
        allocation: String(category.allocation ?? 0),
        currentSpend: String(category.currentSpend ?? 0),
      };
      const resp = await request<{ updateExpenseCategory: { id: number } }>(
        UPDATE_EXPENSE_CATEGORY,
        { input } as unknown as Record<string, unknown>,
      );
      return resp.updateExpenseCategory.id;
    },
    [request],
  );

  const deleteCategory = useCallback(
    async (category: Category) => {
      await request<{ deleteExpenseCategory: boolean }>(DELETE_EXPENSE_CATEGORY, {
        id: category.id,
      } as unknown as Record<string, unknown>);
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
