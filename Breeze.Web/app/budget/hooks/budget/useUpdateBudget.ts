import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Budget } from '../../types/budget';

interface UpdateBudgetProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

interface UpdateBudgetMutationProps {
  budgetId: string;
  budget: Budget;
}

/**
 * A hook for updating a budget.
 * Note: The backend updateBudget mutation is not yet implemented.
 * This is a placeholder that will be completed when the API is ready.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
const useUpdateBudget = ({ onSuccess, onSettled }: UpdateBudgetProps) => {
  const mutationFn = useCallback(
    async ({ budgetId, budget }: UpdateBudgetMutationProps): Promise<Budget> => {
      // TODO: Implement updateBudget mutation in GraphQL schema
      // For now, just return the budget to satisfy the interface
      return budget;
    },
    [],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default useUpdateBudget;
