import z from 'zod';

export interface ExpenseSplit {
  id?: string;
  categoryId: string;
  amount: string;
  description?: string | null;
}

export interface Expense {
  id: string;
  userId: string;
  budgetId: string;
  amount: string;
  date: string;
  description: string;
  splits: ExpenseSplit[];
  sourceType: 'MANUAL' | 'RECURRING_TEMPLATE';
  sourceTemplateId?: string | null;
  generationMonth?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  amount: string;
  date: string;
  description: string;
  splits: {
    categoryId: string;
    amount: string;
    description?: string | null;
  }[];
}

export const expenseFormSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  description: z.string().min(1, 'Description is required'),
  splits: z
    .array(
      z.object({
        categoryId: z.string().min(1, 'Category is required'),
        amount: z.string().min(1, 'Amount is required'),
        description: z.string().nullish(),
      }),
    )
    .min(1, 'At least one category split is required'),
});
