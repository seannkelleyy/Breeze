import z from 'zod'

export interface Expense {
  recurrenceInterval: string;
  dueDayOfMonth: number | null;
  id?: number;
  userId: string;
  name: string;
  budgetId: number;
  categoryId: number;
  amount: number;
  date: string;
  notes?: string;
}

export const expenseFormSchema = z.object({
  id: z.number().optional(),
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required'),
  budgetId: z.number(),
  categoryId: z.number(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string(),
  notes: z.string().optional(),
  recurrenceInterval: z.string(),
  dueDayOfMonth: z.number().nullable(),
});
