import { Budget } from '../../types/budget';

/**
 * A hook for regenerating recurring-template  rows for a given budget month.
 */
export const useRegenerateBudget = () => {
  const regenerateBudgetMonth = async (year: number, month: number): Promise<Budget> =>
    Promise.resolve({
      id: 0,
      userId: '',
      monthlyIncome: 0,
      monthlyExpenses: 0,
      date: `${year}-${String(month).padStart(2, '0')}-01`,
    });

  return { regenerateBudgetMonth };
};

export default useRegenerateBudget;
