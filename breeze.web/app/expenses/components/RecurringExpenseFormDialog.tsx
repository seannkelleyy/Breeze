'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RecurringExpenseTemplate,
  ScheduleType,
} from '@/app/budget/hooks/recurring/recurringTemplateServices';
import {
  makeDefaultRecurringExpenseTemplate,
  validateRecurringExpenseTemplate,
} from '@/app/budget/components/recurring/RecurringCategorySection';

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Biweekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

type TemplateInput = Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface RecurringExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: TemplateInput) => Promise<void>;
  initial?: RecurringExpenseTemplate;
}

export function RecurringExpenseFormDialog({
  open,
  onOpenChange,
  onSave,
  initial,
}: RecurringExpenseFormDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [template, setTemplate] = useState<TemplateInput>(
    initial
      ? {
          name: initial.name,
          amount: initial.amount,
          recurrenceInterval: initial.recurrenceInterval,
          paydayDayOfMonth: initial.paydayDayOfMonth,
          startDate: toDateInputValue(initial.startDate),
          endDate: initial.endDate ? toDateInputValue(initial.endDate) : null,
        }
      : makeDefaultRecurringExpenseTemplate(today),
  );
  const [saving, setSaving] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);

  const errors = validateRecurringExpenseTemplate(template);
  const isValid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    setAttemptedSave(true);
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave(template);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={template.name}
              onChange={(e) => setTemplate((p) => ({ ...p, name: e.target.value }))}
              placeholder="Netflix, Rent, etc."
              className={attemptedSave && errors.name ? 'border-destructive' : ''}
            />
            {attemptedSave && errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={template.amount}
              onChange={(e) => setTemplate((p) => ({ ...p, amount: e.target.value }))}
              className={attemptedSave && errors.amount ? 'border-destructive' : ''}
            />
            {attemptedSave && errors.amount && (
              <p className="text-destructive text-xs">{errors.amount}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Schedule</Label>
            <Select
              value={template.recurrenceInterval}
              onValueChange={(v) =>
                setTemplate((p) => ({ ...p, recurrenceInterval: v as ScheduleType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {template.recurrenceInterval === 'MONTHLY' && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={template.paydayDayOfMonth ?? 1}
                onChange={(e) =>
                  setTemplate((p) => ({ ...p, paydayDayOfMonth: Number(e.target.value) }))
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={toDateInputValue(template.startDate)}
              onChange={(e) => setTemplate((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date (optional)</Label>
            <Input
              type="date"
              value={toDateInputValue(template.endDate)}
              onChange={(e) => setTemplate((p) => ({ ...p, endDate: e.target.value || null }))}
              className={attemptedSave && errors.endDate ? 'border-destructive' : ''}
            />
            {attemptedSave && errors.endDate && (
              <p className="text-destructive text-xs">{errors.endDate}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
