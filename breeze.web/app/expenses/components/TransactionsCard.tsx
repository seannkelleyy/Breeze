'use client';
import { useMemo, useState } from 'react';
import { Landmark, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useTransactions } from '@/lib/services/hooks/useTransactions';
import { GET_BUDGET_BY_DATE, GET_CATEGORIES } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { cn, formatCurrencyWithCode } from '@/lib/utils';

interface CategoryOption {
  id: string;
  name: string;
}

interface TransactionsCardProps {
  userId?: string | null;
  currencyCode: string;
}

/**
 * Bank transactions synced from Plaid. Assign each to one of the current
 * budget's spending categories — the classic budget-app flow of pulling
 * transactions from accounts and filing them under monthly spending.
 */
export function TransactionsCard({ userId, currencyCode }: TransactionsCardProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const { request } = useGraphql();
  const { transactions, isLoading, assignCategory, removeTransaction } = useTransactions(userId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Current month's budget drives the category list assignments write into.
  const { data: categories } = useQuery<CategoryOption[]>({
    queryKey: ['transactionCategories', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const budgetResp = await request<
        { getBudgetByDate: { id: string } | null },
        { userId: string; date: string }
      >(GET_BUDGET_BY_DATE, { userId: userId as string, date });
      const budgetId = budgetResp.getBudgetByDate?.id;
      if (!budgetId) return [];
      const catResp = await request<
        { expenseCategories: Array<{ id: string; name: string }> },
        { budgetId: string }
      >(GET_CATEGORIES, { budgetId });
      return catResp.expenseCategories ?? [];
    },
  });

  const categorizedCount = useMemo(
    () => transactions.filter((t) => t.expenseCategoryId).length,
    [transactions],
  );

  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="text-muted-foreground h-4 w-4" />
            <div>
              <CardTitle className="text-sm font-medium">Bank Transactions</CardTitle>
              <CardDescription className="text-xs">
                {categorizedCount} of {transactions.length} assigned to a spending category · last
                6 months
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground py-4 text-center text-sm">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed py-6 text-center text-sm">
            No transactions yet. Connect accounts on{' '}
            <a href="/plaid-connections" className="underline underline-offset-2">
              Plaid Connections
            </a>{' '}
            — balances and transactions sync on every visit.
          </p>
        ) : (
          sorted.map((t) => (
            <div
              key={t.id}
              className={cn(
                'flex flex-wrap items-center gap-2 rounded-md border px-3 py-2',
                t.pending && 'opacity-70',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{t.name || 'Unknown'}</span>
                  {t.pending && (
                    <Badge variant="outline" className="text-[10px]">
                      Pending
                    </Badge>
                  )}
                  {t.plaidTransactionId === null && (
                    <Badge variant="secondary" className="text-[10px]">
                      Manual
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">{t.date}</span>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold',
                  t.amount < 0 ? 'text-success' : 'text-foreground',
                )}
              >
                {t.amount < 0 ? '+' : ''}
                {fc(Math.abs(t.amount))}
              </span>
              <Select
                value={t.expenseCategoryId ?? 'none'}
                onValueChange={(v) =>
                  assignCategory.mutate({ id: t.id, categoryId: v === 'none' ? null : v })
                }
              >
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Assign category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive size-7 cursor-pointer"
                onClick={() => setDeletingId(t.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Transaction"
        description="Remove this transaction? Bank-synced transactions will reappear on the next sync."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingId) removeTransaction.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </Card>
  );
}

export default TransactionsCard;
