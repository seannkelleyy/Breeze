'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useGraphql from '@/lib/services/useGraphql';
import { GET_CATEGORIES } from '@/lib/services/queries/budget';
import { GET_TRANSACTIONS } from '@/lib/services/queries/planning';
import { cn, formatCurrencyWithCode } from '@/lib/utils';

interface BankActualsCardProps {
  userId?: string | null;
  /** The budget month being viewed (any date within it). */
  monthDate: Date;
  budgetId?: string | null;
  currencyCode: string;
}

/**
 * Plan vs actual: bank transactions for the viewed month grouped by the
 * budget's spending categories, next to each category's allocation.
 */
export function BankActualsCard({ userId, monthDate, budgetId, currencyCode }: BankActualsCardProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const { request } = useGraphql();

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const fromDate = new Date(year, month, 1);
  const toDate = new Date(year, month + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const { data: categories } = useQuery({
    queryKey: ['bankActualsCategories', budgetId],
    enabled: Boolean(budgetId),
    queryFn: async () => {
      const resp = await request<
        { expenseCategories: Array<{ id: string; name: string; allocation: string }> },
        { budgetId: string }
      >(GET_CATEGORIES, { budgetId: budgetId as string });
      return resp.expenseCategories ?? [];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['bankActualsTransactions', userId, iso(fromDate), iso(toDate)],
    enabled: Boolean(userId),
    queryFn: async () => {
      const resp = await request<
        { transactions: Array<{ id: string; expenseCategoryId: string | null; amount: string; pending: boolean }> },
        { userId: string; fromDate: string; toDate: string }
      >(GET_TRANSACTIONS, { userId: userId as string, fromDate: iso(fromDate), toDate: iso(toDate) });
      return resp.transactions ?? [];
    },
  });

  const rows = useMemo(() => {
    const txns = transactions ?? [];
    const totalsByCategory = new Map<string, number>();
    let uncategorized = 0;
    for (const t of txns) {
      const amount = Number(t.amount) || 0;
      if (amount <= 0) continue; // income (money in) isn't spending
      if (t.expenseCategoryId) {
        totalsByCategory.set(t.expenseCategoryId, (totalsByCategory.get(t.expenseCategoryId) ?? 0) + amount);
      } else {
        uncategorized += amount;
      }
    }

    const out = (categories ?? []).map((c) => {
      const bank = totalsByCategory.get(c.id) ?? 0;
      totalsByCategory.delete(c.id);
      return {
        id: c.id,
        name: c.name,
        allocation: Number(c.allocation) || 0,
        bank,
      };
    });
    for (const [categoryId, bank] of totalsByCategory) {
      out.push({ id: categoryId, name: 'Other', allocation: 0, bank });
    }
    if (uncategorized > 0) {
      out.push({ id: 'uncategorized', name: 'Uncategorized', allocation: 0, bank: uncategorized });
    }
    return out.filter((r) => r.allocation > 0 || r.bank > 0);
  }, [categories, transactions]);

  if (!budgetId) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Bank Spending — Actuals</CardTitle>
        <CardDescription className="text-xs">
          Categorized bank transactions vs each category&apos;s allocation for this month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {'No categorized bank transactions this month yet.'}
          </p>
        ) : (
          rows.map((row) => {
            const over = row.bank > row.allocation && row.allocation > 0;
            return (
              <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{row.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">alloc {fc(row.allocation)}</span>
                  <span
                    className={cn(
                      'w-24 text-right font-medium',
                      over ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {fc(row.bank)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default BankActualsCard;
