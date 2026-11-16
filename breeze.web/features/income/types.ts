import z from 'zod';
import type { IncomeFieldsFragment } from '@/lib/gql/graphql';

/** Domain entity type, derived from the generated document — can't drift from the schema. */
export type Income = IncomeFieldsFragment;

/** Payload for creating/updating an income. */
export interface IncomeInput {
  name: string;
  amount: string;
  date: string;
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
