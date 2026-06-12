'use client';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RecurringCategoryTemplate } from '../../hooks/recurring/recurringTemplateServices';

export function makeDefaultCategoryTemplate(today: string): RecurringCategoryTemplate {
  return {
    name: '',
    allocation: 0,
    startDate: today,
    stopDate: null,
    isActive: true,
  };
}

interface CategoryTemplateErrors {
  name?: string;
  allocation?: string;
  stopDate?: string;
}

export function validateCategoryTemplate(
  template: RecurringCategoryTemplate,
): CategoryTemplateErrors {
  const errors: CategoryTemplateErrors = {};
  if (!template.name.trim()) errors.name = 'Name is required.';
  if (template.allocation < 0) errors.allocation = 'Allocation must be 0 or greater.';
  if (template.stopDate && template.startDate && template.stopDate < template.startDate) {
    errors.stopDate = 'Stop date must be on or after start date.';
  }
  return errors;
}

interface RecurringCategorySectionProps {
  templates: RecurringCategoryTemplate[];
  attemptedSave: boolean;
  saving: boolean;
  today: string;
  onUpdate: React.Dispatch<React.SetStateAction<RecurringCategoryTemplate[]>>;
  onDelete: (template: RecurringCategoryTemplate, index: number) => void;
}

export const RecurringCategorySection = ({
  templates,
  attemptedSave,
  saving,
  today,
  onUpdate,
  onDelete,
}: RecurringCategorySectionProps) => {
  return (
    <section className="bg-muted/10 grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Recurring Category Allocations</h3>
          <p className="text-muted-foreground text-sm">
            Use this for planned monthly category budgets.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onUpdate((curr) => [...curr, makeDefaultCategoryTemplate(today)])}
        >
          Add Recurring Category
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recurring category templates yet.</p>
        ) : null}
        {templates.map((template, index) => {
          const errors = validateCategoryTemplate(template);
          return (
            <div
              key={template.id ?? `new-category-${index}`}
              className="bg-background/80 rounded-lg border p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge variant={template.isActive ? 'secondary' : 'outline'}>
                  {template.isActive ? 'Active' : 'Paused'}
                </Badge>
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
                    placeholder="Rent"
                    className={attemptedSave && errors.name ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.name ? (
                    <p className="text-destructive mt-1 text-xs">{errors.name}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Allocation</label>
                  <Input
                    type="number"
                    value={template.allocation}
                    onChange={(e) =>
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index ? { ...item, allocation: Number(e.target.value || 0) } : item,
                        ),
                      )
                    }
                    className={attemptedSave && errors.allocation ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.allocation ? (
                    <p className="text-destructive mt-1 text-xs">{errors.allocation}</p>
                  ) : null}
                </div>
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
                  <label className="text-muted-foreground text-sm">Stop (optional)</label>
                  <Input
                    type="date"
                    value={template.stopDate ?? ''}
                    onChange={(e) =>
                      onUpdate((curr) =>
                        curr.map((item, i) =>
                          i === index ? { ...item, stopDate: e.target.value || null } : item,
                        ),
                      )
                    }
                    className={attemptedSave && errors.stopDate ? 'border-destructive' : ''}
                  />
                  {attemptedSave && errors.stopDate ? (
                    <p className="text-destructive mt-1 text-xs">{errors.stopDate}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onUpdate((curr) => [...curr, makeDefaultCategoryTemplate(today)])}
          >
            Add Recurring Category
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecurringCategorySection;
