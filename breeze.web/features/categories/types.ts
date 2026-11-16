import { z } from 'zod';
import type { CategoryFieldsFragment } from '@/lib/gql/graphql';

/** Domain entity type, derived from the generated document — can't drift from the schema. */
export type Category = CategoryFieldsFragment;

/** Payload for creating/updating a category. */
export interface CategoryInput {
  name: string;
  allocation: string;
}

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  allocation: z.string().min(1, 'Allocation is required'),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
