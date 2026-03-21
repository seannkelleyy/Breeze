import z from 'zod';

export interface Category {
  id?: number;
  userId: string;
  name: string;
  budgetId: number;
  currentSpend: number;
  allocation: number;
  sourceType?: 'manual' | 'recurring-template';
  sourceTemplateId?: number | null;
  generationMonth?: string | null;
}

export const categoryFormSchema = z.object({
  id: z.number().optional(),
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required'),
  budgetId: z.number(),
  currentSpend: z.number(),
  allocation: z.number().min(0.01, 'Allocation must be greater than 0'),
});
