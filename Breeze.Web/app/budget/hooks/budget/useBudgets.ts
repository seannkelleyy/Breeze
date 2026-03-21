import useHttp from '@/lib/services/useHttp';
import { Budget } from '../../types/budget';

const useBudgets = () => {
  const { getOne } = useHttp();

  const getBudget = async (year: number, month: number): Promise<Budget> =>
    await getOne<Budget>(`budgets/${year}-${month}`);

  return { getBudget };
};

export default useBudgets;
