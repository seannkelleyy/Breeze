import z from 'zod';

export interface Budget {
  id: string;
  userId: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export const budgetFormSchema = z.object({
  monthlyIncome: z.string().min(1, 'Monthly income is required'),
  monthlyExpenses: z.string().min(1, 'Monthly expenses is required'),
});

export interface BudgetFormData {
  monthlyIncome: string;
  monthlyExpenses: string;
}
