import z from 'zod';

export interface Goal {
  id?: number;
  userId: string;
  description: string;
  isCompleted: boolean;
}

export const goalFormSchema = z.object({
  id: z.number().optional(),
  userId: z.string().min(1, 'User ID is required'),
  description: z.string().min(1, 'Description is required'),
  isCompleted: z.boolean(),
});
