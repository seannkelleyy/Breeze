import { z } from 'zod';

export interface Category {
  id: string;
  userId: string;
  budgetId: string;
  name: string;
  allocation: string;
  currentSpend: string;
  createdAt: string;
  updatedAt: string;
}

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  allocation: z.string().min(1, 'Allocation is required'),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
