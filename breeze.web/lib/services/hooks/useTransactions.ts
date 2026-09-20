'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useGraphql from '@/lib/services/useGraphql';
import {
  ASSIGN_TRANSACTION_CATEGORY,
  DELETE_TRANSACTION,
  GET_TRANSACTIONS,
} from '@/lib/services/queries/planning';

export interface BankTransaction {
  id: string;
  plaidAccountId: string | null;
  plaidTransactionId: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** Positive = money out (spend), negative = money in. */
  amount: number;
  name: string;
  expenseCategoryId: string | null;
  pending: boolean;
}

interface TransactionDto {
  id: string;
  plaidAccountId: string | null;
  plaidTransactionId: string | null;
  date: string;
  amount: string;
  name: string;
  expenseCategoryId: string | null;
  pending: boolean;
}

const mapTransaction = (t: TransactionDto): BankTransaction => ({
  id: t.id,
  plaidAccountId: t.plaidAccountId,
  plaidTransactionId: t.plaidTransactionId,
  date: t.date,
  amount: Number(t.amount) || 0,
  name: t.name,
  expenseCategoryId: t.expenseCategoryId,
  pending: t.pending,
});

export const useTransactions = (userId?: string | null, months = 6) => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();
  const queryKey = ['transactions', userId, months];

  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const fromDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    .toISOString()
    .slice(0, 10);

  const { data, isLoading, isError } = useQuery<BankTransaction[]>({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await request<
        { transactions: TransactionDto[] },
        { userId: string; fromDate: string; toDate: string }
      >(GET_TRANSACTIONS, { userId: userId as string, fromDate, toDate });
      return (response.transactions ?? []).map(mapTransaction);
    },
  });

  const assignCategory = useMutation({
    mutationFn: async ({ id, categoryId }: { id: string; categoryId: string | null }) => {
      const response = await request<
        { assignTransactionCategory: { id: string; expenseCategoryId: string | null } },
        { id: string; expenseCategoryId: string | null }
      >(ASSIGN_TRANSACTION_CATEGORY, { id, expenseCategoryId: categoryId });
      queryClient.setQueryData<BankTransaction[]>(queryKey, (prev = []) =>
        prev.map((t) =>
          t.id === response.assignTransactionCategory.id
            ? { ...t, expenseCategoryId: response.assignTransactionCategory.expenseCategoryId }
            : t,
        ),
      );
    },
  });

  const removeTransaction = useMutation({
    mutationFn: async (id: string) => {
      await request<{ deleteTransaction: boolean }, { id: string }>(DELETE_TRANSACTION, { id });
      queryClient.setQueryData<BankTransaction[]>(queryKey, (prev = []) =>
        prev.filter((t) => t.id !== id),
      );
    },
  });

  return {
    transactions: data ?? [],
    isLoading,
    isError,
    assignCategory,
    removeTransaction,
  };
};

export default useTransactions;
