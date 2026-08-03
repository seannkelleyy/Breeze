import { useMutation } from '@tanstack/react-query';
import { UPDATE_BUDGET } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../../types/budget';

interface UpdateBudgetProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

interface UpdateBudgetMutationProps {
  budgetId: string;
  budget: Budget;
}

const useUpdateBudget = ({ onSuccess, onSettled }: UpdateBudgetProps) => {
  const { request } = useGraphql();

  return useMutation({
    mutationFn: async ({ budgetId, budget }: UpdateBudgetMutationProps): Promise<Budget> => {
      const res = await request<{ updateBudget: Budget }>(UPDATE_BUDGET, {
        input: {
          id: budgetId,
          monthlyIncome: budget.monthlyIncome,
          monthlyExpenses: budget.monthlyExpenses,
        },
      });
      return res.updateBudget;
    },
    onSuccess,
    onSettled,
  });
};

export default useUpdateBudget;
