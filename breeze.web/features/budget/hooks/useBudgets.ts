import { GET_BUDGET_BY_DATE } from '@/features/budget/budget.operations';

import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../types';

const useBudgets = () => {
  const { request } = useGraphql();

  const getBudget = async (year: number, month: number): Promise<Budget | null> => {
    const date = new Date(year, month - 1, 1).toISOString();

    const res = await request(GET_BUDGET_BY_DATE, { date });
    return res?.budgetByDate ?? null;
  };

  return { getBudget };
};

export default useBudgets;
