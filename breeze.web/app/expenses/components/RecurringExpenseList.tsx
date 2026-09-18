'use client';
import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RecurringExpenseTemplate } from '@/app/budget/hooks/recurring/recurringTemplateServices';
import { formatCurrencyWithCode } from '@/lib/utils';
import { RecurringExpenseFormDialog } from './RecurringExpenseFormDialog';

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

function nextOccurrence(template: RecurringExpenseTemplate): string {
  const start = new Date(template.startDate);
  const now = new Date();
  const interval = template.recurrenceInterval;

  if (interval === 'MONTHLY') {
    const day = template.paydayDayOfMonth ?? 1;
    const next = new Date(now.getFullYear(), now.getMonth(), day);
    if (next < now) next.setMonth(next.getMonth() + 1);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (interval === 'WEEKLY') {
    const diff = (start.getDay() - now.getDay() + 7) % 7 || 7;
    const next = new Date(now);
    next.setDate(next.getDate() + diff);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (interval === 'BIWEEKLY') {
    const diff = (start.getDay() - now.getDay() + 14) % 14 || 14;
    const next = new Date(now);
    next.setDate(next.getDate() + diff);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (interval === 'QUARTERLY') {
    const next = new Date(now);
    const qMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
    next.setMonth(qMonth, template.paydayDayOfMonth ?? 1);
    if (next < now) next.setMonth(next.getMonth() + 3);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (interval === 'YEARLY') {
    const next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return toDateInputValue(template.startDate);
}

const INTERVAL_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

interface RecurringExpenseListProps {
  templates: RecurringExpenseTemplate[];
  currencyCode: string;
  onCreate: (
    template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
  onUpdate: (template: RecurringExpenseTemplate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RecurringExpenseList({
  templates,
  currencyCode,
  onCreate,
  onUpdate,
  onDelete,
}: RecurringExpenseListProps) {
  const [editing, setEditing] = useState<RecurringExpenseTemplate | null>(null);
  const [deleting, setDeleting] = useState<RecurringExpenseTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  const handleCreate = async (
    template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => {
    await onCreate(template);
  };

  const handleUpdate = async (
    template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editing) {
      await onUpdate({ ...editing, ...template });
      setEditing(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recurring Expenses</h2>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" /> Add Expense
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
          No recurring expenses yet. Add your first one to get started.
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-muted/30 hover:bg-muted/50 flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{t.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {INTERVAL_LABELS[t.recurrenceInterval] ?? t.recurrenceInterval}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Next: {nextOccurrence(t)}
                  {t.endDate && ` · Ends ${toDateInputValue(t.endDate)}`}
                </p>
              </div>
              <span className="text-foreground shrink-0 text-sm font-semibold">
                {fc(Number(t.amount))}
              </span>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 cursor-pointer"
                  onClick={() => {
                    setEditing(t);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="size-8 cursor-pointer"
                  onClick={() => setDeleting(t)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecurringExpenseFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSave={editing ? handleUpdate : handleCreate}
        initial={editing ?? undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete Expense"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleting) {
            await onDelete(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </>
  );
}
