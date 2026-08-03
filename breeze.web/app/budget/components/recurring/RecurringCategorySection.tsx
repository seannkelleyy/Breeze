'use client';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from '../../hooks/recurring/recurringTemplateServices';

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

export function makeDefaultRecurringExpenseTemplate(
  today: string,
): Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    amount: '0',
    recurrenceInterval: 'MONTHLY',
    paydayDayOfMonth: 1,
    startDate: today,
    endDate: null,
  };
}

interface RecurringExpenseTemplateErrors {
  name?: string;
  amount?: string;
  startDate?: string;
  endDate?: string;
}

export function validateRecurringExpenseTemplate(
  template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): RecurringExpenseTemplateErrors {
  const errors: RecurringExpenseTemplateErrors = {};
  if (!template.name.trim()) errors.name = 'Name is required.';
  if (Number(template.amount) <= 0) errors.amount = 'Amount must be greater than 0.';
  if (template.endDate && template.startDate && template.endDate < template.startDate) {
    errors.endDate = 'End date must be on or after start date.';
  }
  return errors;
}

interface RecurringCategorySectionProps {
  templates: RecurringExpenseTemplate[];
  newTemplates: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
  attemptedSave: boolean;
  saving: boolean;
  onAddNew: () => void;
  onRemoveNew: (index: number) => void;
  onUpdateNew: (
    index: number,
    updater: (
      prev: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    ) => Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => void;
  onDeleteExisting: (template: RecurringExpenseTemplate) => void;
}

export const RecurringCategorySection = ({
  templates,
  newTemplates,
  attemptedSave,
  saving,
  onAddNew,
  onRemoveNew,
  onUpdateNew,
  onDeleteExisting,
}: RecurringCategorySectionProps) => {
  return (
    <section className="bg-muted/10 grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Recurring Expenses</h3>
          <p className="text-muted-foreground text-sm">
            Set up recurring bills like mortgage, phone, insurance. They auto-populate when you
            regenerate a budget month.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onAddNew} disabled={saving}>
          Add Recurring Expense
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 && newTemplates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recurring expenses yet.</p>
        ) : null}

        {/* Existing templates (from DB) */}
        {templates.map((template) => (
          <div key={template.id} className="bg-background/80 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge variant="secondary">{template.recurrenceInterval}</Badge>
              <Button
                size="sm"
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={() => onDeleteExisting(template)}
              >
                Delete
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="text-muted-foreground text-sm">Name</label>
                <div className="text-sm font-medium">{template.name}</div>
              </div>
              <div>
                <label className="text-muted-foreground text-sm">Amount</label>
                <div className="text-sm font-medium">${template.amount}</div>
              </div>
              <div>
                <label className="text-muted-foreground text-sm">Schedule</label>
                <div className="text-sm font-medium">{template.recurrenceInterval}</div>
              </div>
              <div>
                <label className="text-muted-foreground text-sm">Start</label>
                <div className="text-sm font-medium">{toDateInputValue(template.startDate)}</div>
              </div>
            </div>
          </div>
        ))}

        {/* New templates (being created) */}
        {newTemplates.map((template, index) => {
          const errors = validateRecurringExpenseTemplate(template);
          return (
            <div key={`new-expense-${index}`} className="bg-background/80 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge variant="outline">New</Badge>
                <Button
                  size="sm"
                  type="button"
                  variant="destructive"
                  disabled={saving}
                  onClick={() => onRemoveNew(index)}
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label className="text-muted-foreground text-sm">Name</label>
                  <Input
                    value={template.name}
                    onChange={(e) =>
                      onUpdateNew(index, (prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Mortgage"
                    className={attemptedSave && errors.name ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.name ? (
                    <p className="text-destructive mt-1 text-xs">{errors.name}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Amount</label>
                  <Input
                    type="number"
                    value={template.amount}
                    onChange={(e) =>
                      onUpdateNew(index, (prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className={attemptedSave && errors.amount ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.amount ? (
                    <p className="text-destructive mt-1 text-xs">{errors.amount}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Schedule</label>
                  <Select
                    value={template.recurrenceInterval}
                    onValueChange={(value) =>
                      onUpdateNew(index, (prev) => ({
                        ...prev,
                        recurrenceInterval: value as ScheduleType,
                      }))
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
                {template.recurrenceInterval === 'MONTHLY' ? (
                  <div>
                    <label className="text-muted-foreground text-sm">Day of Month</label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={template.paydayDayOfMonth ?? 1}
                      onChange={(e) =>
                        onUpdateNew(index, (prev) => ({
                          ...prev,
                          paydayDayOfMonth: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                ) : null}
                <div>
                  <label className="text-muted-foreground text-sm">Start</label>
                  <Input
                    type="date"
                    value={toDateInputValue(template.startDate)}
                    onChange={(e) =>
                      onUpdateNew(index, (prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">End (optional)</label>
                  <Input
                    type="date"
                    value={toDateInputValue(template.endDate)}
                    onChange={(e) =>
                      onUpdateNew(index, (prev) => ({
                        ...prev,
                        endDate: e.target.value || null,
                      }))
                    }
                    className={attemptedSave && errors.endDate ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.endDate ? (
                    <p className="text-destructive mt-1 text-xs">{errors.endDate}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onAddNew} disabled={saving}>
            Add Recurring Expense
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecurringCategorySection;
