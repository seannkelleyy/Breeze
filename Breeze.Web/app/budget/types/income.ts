import z from 'zod';

export interface Income {
  id: string;
  userId: string;
  budgetId: string;
  name: string;
  amount: string;
  date: string;
  sourceType: 'MANUAL' | 'RECURRING_TEMPLATE';
  sourceTemplateId?: string | null;
  sourceOccurrenceDate?: string | null;
  generationMonth?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeFormData {
  name: string;
  amount: string;
  date: string;
}

export const incomeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Date must be in YYYY-MM-DD format',
  }),
});
