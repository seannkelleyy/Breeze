import { CREATE_INCOME, DELETE_INCOME, UPDATE_INCOME } from '@/features/income/income.mutations';

import useGraphql from '@/lib/services/useGraphql';
import { Income, IncomeInput } from '../types';
import { GET_INCOMES_BY_BUDGET } from '@/features/income/income.queries';

/**
 * A hook for fetching and mutating incomes via GraphQL.
 */
const useIncomes = () => {
  const { request } = useGraphql();

  const getIncomes = async (budgetId: string): Promise<Income[]> => {
    const resp = await request(GET_INCOMES_BY_BUDGET, {
      budgetId,
    });
    return resp?.incomes ?? [];
  };

  const postIncome = async (budgetId: string, income: IncomeInput): Promise<string> => {
    const input = {
      budgetId,
      name: income.name,
      amount: income.amount,
      date: income.date,
      sourceType: 'MANUAL' as const,
    };
    const resp = await request(CREATE_INCOME, {
      input,
    });
    return resp.createIncome.id;
  };

  const patchIncome = async (income: Income): Promise<string> => {
    const input = {
      id: income.id,
      name: income.name,
      amount: income.amount,
      date: income.date,
      sourceType: income.sourceType,
    };
    const resp = await request(UPDATE_INCOME, {
      input,
    });
    return resp.updateIncome.id;
  };

  const deleteIncome = async (incomeId: string) => {
    await request(DELETE_INCOME, {
      id: incomeId,
    });
    return true;
  };

  return { getIncomes, postIncome, patchIncome, deleteIncome };
};

export default useIncomes;
