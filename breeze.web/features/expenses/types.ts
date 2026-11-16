import z from 'zod';
import type { ExpenseFieldsFragment } from '@/lib/gql/graphql';

/** Domain entity type, derived from the generated document — can't drift from the schema. */
export type Expense = ExpenseFieldsFragment;

/** Payload for creating/updating an expense. */
export interface ExpenseInput {
  amount: string;
  date: string;
  description: string;
  splits: Array<{ categoryId: string; amount: string; description?: string | null }>;
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
