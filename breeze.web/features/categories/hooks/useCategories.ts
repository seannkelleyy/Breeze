import {
  CREATE_EXPENSE_CATEGORY,
  DELETE_EXPENSE_CATEGORY,
  UPDATE_EXPENSE_CATEGORY,
} from '@/features/categories/category.mutations';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Category, CategoryInput } from '../types';
import { GET_CATEGORIES } from '@/features/categories/category.queries';

/**
 * A hook for fetching and mutating category data via GraphQL.
 */
const useCategories = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getCategories = async (budgetId: string): Promise<Category[]> => {
    const resp = await request(GET_CATEGORIES, { budgetId });
    return resp?.expenseCategories ?? [];
  };

  const postCategory = async (
    budgetId: string,
    _userId: string,
    category: CategoryInput,
  ): Promise<string> => {
    const input = {
      userId,
      budgetId,
      name: category.name,
      allocation: category.allocation,
      currentSpend: '0',
    };
    const resp = await request(CREATE_EXPENSE_CATEGORY, { input });
    return resp.createExpenseCategory.id;
  };

  const patchCategory = async (category: Category): Promise<string> => {
    const input = {
      id: category.id,
      name: category.name,
      allocation: category.allocation,
      currentSpend: category.currentSpend,
    };
    const resp = await request(UPDATE_EXPENSE_CATEGORY, { input });
    return resp.updateExpenseCategory.id;
  };

  const deleteCategory = async (categoryId: string) => {
    await request(DELETE_EXPENSE_CATEGORY, { id: categoryId });
    return true;
  };

  return { getCategories, postCategory, patchCategory, deleteCategory };
};

export default useCategories;
