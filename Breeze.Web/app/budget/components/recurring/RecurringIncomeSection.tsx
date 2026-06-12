'use client';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RecurringIncomeTemplate,
  ScheduleType,
} from '../../hooks/recurring/recurringTemplateServices';

const scheduleLabel: Record<ScheduleType, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export function makeDefaultIncomeTemplate(
  today: string,
): Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    amount: '0',
    recurrenceInterval: 'BIWEEKLY',
    paydayDayOfMonth: undefined,
    startDate: today,
    endDate: null,
  };
}

interface IncomeTemplateErrors {
  name?: string;
  amount?: string;
  endDate?: string;
}

export function validateIncomeTemplate(
  template:
    | RecurringIncomeTemplate
    | Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): IncomeTemplateErrors {
  const errors: IncomeTemplateErrors = {};
  if (!template.name.trim()) errors.name = 'Name is required.';
  const amountNum = parseFloat(template.amount);
  if (isNaN(amountNum) || amountNum <= 0) errors.amount = 'Amount must be greater than 0.';
  if (template.endDate && template.startDate && template.endDate < template.startDate) {
    errors.endDate = 'End date must be on or after start date.';
  }
  return errors;
}

type IncomeTemplate =
  | RecurringIncomeTemplate
  | Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface RecurringIncomeSectionProps {
  templates: IncomeTemplate[];
  attemptedSave: boolean;
  saving: boolean;
  today: string;
  onUpdate: React.Dispatch<React.SetStateAction<IncomeTemplate[]>>;
  onDelete: (template: IncomeTemplate, index: number) => void;
}

export const RecurringIncomeSection = ({
  templates,
  attemptedSave,
  saving,
  today,
  onUpdate,
  onDelete,
}: RecurringIncomeSectionProps) => {
  return (
    <section className="bg-muted/10 grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Recurring Incomes</h3>
          <p className="text-muted-foreground text-sm">
            Use this for payroll and predictable deposits.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onUpdate((curr) => [...curr, makeDefaultIncomeTemplate(today)])}
        >
          Add Recurring Income
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recurring income templates yet.</p>
        ) : null}
        {templates.map((template, index) => {
          const errors = validateIncomeTemplate(template);
          const key = 'id' in template && template.id ? template.id : `new-income-${index}`;
          return (
            <div key={key} className="bg-background/80 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="destructive"
                  disabled={saving}
                  onClick={() => onDelete(template, index)}
                >
                  Delete
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="md:col-span-2">
                  <label className="text-muted-foreground text-sm">Name</label>
                  <Input
                    value={template.name}
                    onChange={(e) =>
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Paycheck"
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
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index ? { ...item, amount: e.target.value || '0' } : item,
                        ),
                      )
                    }
                    className={attemptedSave && errors.amount ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.amount ? (
                    <p className="text-destructive mt-1 text-xs">{errors.amount}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Schedule</label>
                  <select
                    className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                    value={template.recurrenceInterval}
                    onChange={(e) =>
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index
                            ? { ...item, recurrenceInterval: e.target.value as ScheduleType }
                            : item,
                        ),
                      )
                    }
                  >
                    {Object.entries(scheduleLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div>
                  <label className="text-muted-foreground text-sm">Start</label>
                  <Input
                    type="date"
                    value={template.startDate}
                    onChange={(e) =>
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index ? { ...item, startDate: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">End (optional)</label>
                  <Input
                    type="date"
                    value={template.endDate ?? ''}
                    onChange={(e) =>
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index ? { ...item, endDate: e.target.value || null } : item,
                        ),
                      )
                    }
                    className={attemptedSave && errors.endDate ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.endDate ? (
                    <p className="text-destructive mt-1 text-xs">{errors.endDate}</p>
                  ) : null}
                </div>
                {template.recurrenceInterval === 'MONTHLY' ? (
                  <div>
                    <label className="text-muted-foreground text-sm">Day of Month</label>
                    <Input
                      type="number"
                      value={template.paydayDayOfMonth ?? ''}
                      onChange={(e) =>
                        onUpdate((curr) =>
                          curr.map((item, i) =>
                            i === index
                              ? { ...item, paydayDayOfMonth: Number(e.target.value || 1) }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onUpdate((curr) => [...curr, makeDefaultIncomeTemplate(today)])}
          >
            Add Recurring Income
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecurringIncomeSection;
