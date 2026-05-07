'use client';
import React, { useCallback, useEffect, useState } from 'react';

import { useBudgetContext } from '../../providers';
import { BreezeDialog } from '../../../../components/common/dialog/BreezeDialog';
import {
  RecurringCategoryTemplate,
  RecurringIncomeTemplate,
  ScheduleType,
  useRecurringTemplates,
} from '../../hooks/recurring/recurringTemplateServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const today = new Date().toISOString().split('T')[0];

const defaultIncomeTemplate = (): RecurringIncomeTemplate => ({
  name: '',
  amount: 0,
  scheduleType: 'biweekly',
  anchorDate: today,
  semiMonthlyDay1: 1,
  semiMonthlyDay2: 15,
  monthlyDayOfMonth: 1,
  startDate: today,
  stopDate: null,
  isActive: true,
});

const defaultCategoryTemplate = (): RecurringCategoryTemplate => ({
  name: '',
  allocation: 0,
  startDate: today,
  stopDate: null,
  isActive: true,
});

const scheduleLabel: Record<ScheduleType, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  semimonthly: 'Semi-Monthly',
  monthly: 'Monthly',
};

interface IncomeTemplateErrors {
  name?: string;
  amount?: string;
  stopDate?: string;
  semiMonthlyDays?: string;
}

interface CategoryTemplateErrors {
  name?: string;
  allocation?: string;
  stopDate?: string;
}

const validateIncomeTemplate = (template: RecurringIncomeTemplate): IncomeTemplateErrors => {
  const errors: IncomeTemplateErrors = {};
  if (!template.name.trim()) errors.name = 'Name is required.';
  if (template.amount <= 0) errors.amount = 'Amount must be greater than 0.';
  if (template.stopDate && template.startDate && template.stopDate < template.startDate) {
    errors.stopDate = 'Stop date must be on or after start date.';
  }
  if (template.scheduleType === 'semimonthly') {
    const d1 = template.semiMonthlyDay1 ?? 0;
    const d2 = template.semiMonthlyDay2 ?? 0;
    if (!d1 || !d2 || d1 < 1 || d1 > 31 || d2 < 1 || d2 > 31) {
      errors.semiMonthlyDays = 'Both Day 1 and Day 2 are required for semi-monthly (1–31).';
    } else if (d1 >= d2) {
      errors.semiMonthlyDays = 'Day 1 must be earlier in the month than Day 2.';
    }
  }
  return errors;
};

const validateCategoryTemplate = (template: RecurringCategoryTemplate): CategoryTemplateErrors => {
  const errors: CategoryTemplateErrors = {};
  if (!template.name.trim()) errors.name = 'Name is required.';
  if (template.allocation < 0) errors.allocation = 'Allocation must be 0 or greater.';
  if (template.stopDate && template.startDate && template.stopDate < template.startDate) {
    errors.stopDate = 'Stop date must be on or after start date.';
  }
  return errors;
};

export const RecurringTemplatesDialog = () => {
  const {
    getRecurringIncomeTemplates,
    postRecurringIncomeTemplate,
    patchRecurringIncomeTemplate,
    deleteRecurringIncomeTemplate,
    getRecurringCategoryTemplates,
    postRecurringCategoryTemplate,
    patchRecurringCategoryTemplate,
    deleteRecurringCategoryTemplate,
  } = useRecurringTemplates();
  const { refetchBudget, refetchIncomes, refetchCategories } = useBudgetContext();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);

  const [incomeTemplates, setIncomeTemplates] = useState<RecurringIncomeTemplate[]>([]);
  const [categoryTemplates, setCategoryTemplates] = useState<RecurringCategoryTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [incomeData, categoryData] = await Promise.all([
        getRecurringIncomeTemplates(),
        getRecurringCategoryTemplates(),
      ]);
      setIncomeTemplates(incomeData);
      setCategoryTemplates(categoryData);
    } catch {
      setError('Failed to load recurring templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getRecurringCategoryTemplates, getRecurringIncomeTemplates]);

  useEffect(() => {
    if (open) {
      setAttemptedSave(false);
      void loadTemplates();
    }
  }, [open, loadTemplates]);

  const refreshBudgetViews = async () => {
    await Promise.all([refetchBudget(), refetchIncomes(), refetchCategories()]);
  };

  const handleDeleteIncomeTemplate = async (template: RecurringIncomeTemplate, index: number) => {
    if (!template.id) {
      setIncomeTemplates((current) => current.filter((_, i) => i !== index));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await deleteRecurringIncomeTemplate(template.id);
      setIncomeTemplates((current) => current.filter((_, i) => i !== index));
      await refreshBudgetViews();
    } catch {
      setError('Failed to delete recurring income template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategoryTemplate = async (
    template: RecurringCategoryTemplate,
    index: number,
  ) => {
    if (!template.id) {
      setCategoryTemplates((current) => current.filter((_, i) => i !== index));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await deleteRecurringCategoryTemplate(template.id);
      setCategoryTemplates((current) => current.filter((_, i) => i !== index));
      await refreshBudgetViews();
    } catch {
      setError('Failed to delete recurring category template.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllTemplates = async () => {
    setAttemptedSave(true);
    setError('');

    const hasIncomeErrors = incomeTemplates.some(
      (template) => Object.keys(validateIncomeTemplate(template)).length > 0,
    );
    const hasCategoryErrors = categoryTemplates.some(
      (template) => Object.keys(validateCategoryTemplate(template)).length > 0,
    );

    if (hasIncomeErrors || hasCategoryErrors) {
      setError('Please fix validation issues before saving.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        ...incomeTemplates.map((template) =>
          template.id
            ? patchRecurringIncomeTemplate(template)
            : postRecurringIncomeTemplate(template),
        ),
        ...categoryTemplates.map((template) =>
          template.id
            ? patchRecurringCategoryTemplate(template)
            : postRecurringCategoryTemplate(template),
        ),
      ]);

      await loadTemplates();
      await refreshBudgetViews();
    } catch {
      setError('Failed to save recurring templates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BreezeDialog
      dialogTrigger={<Button variant="outline">Manage Recurring Templates</Button>}
      title="Recurring Templates"
      description="Define repeating incomes and category allocations that auto-populate each month."
      open={open}
      onOpenChange={setOpen}
      dialogContentClassName="!w-[98vw] sm:!w-[96vw] lg:!w-[94vw] !max-w-[1260px]"
    >
      <div className="grid gap-6 pb-2">
        {error ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading recurring templates...</p>
        ) : null}

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
              onClick={() => {
                setAttemptedSave(false);
                setIncomeTemplates((curr) => [...curr, defaultIncomeTemplate()]);
              }}
            >
              Add Recurring Income
            </Button>
          </div>

          <div className="grid gap-4">
            {incomeTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recurring income templates yet.</p>
            ) : null}
            {incomeTemplates.map((template, index) => {
              const errors = validateIncomeTemplate(template);
              return (
                <div
                  key={template.id ?? `new-income-${index}`}
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
                      onClick={() => void handleDeleteIncomeTemplate(template, index)}
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div className="md:col-span-2">
                      <label className="text-muted-foreground text-sm">Name</label>
                      <Input
                        value={template.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setIncomeTemplates((curr) =>
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setIncomeTemplates((curr) =>
                            curr.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    amount: Number(e.target.value || 0),
                                  }
                                : item,
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
                        value={template.scheduleType}
                        onChange={(e) =>
                          setIncomeTemplates((curr) =>
                            curr.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    scheduleType: e.target.value as ScheduleType,
                                  }
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
                    <div>
                      <label className="text-muted-foreground text-sm">Status</label>
                      <select
                        className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                        value={template.isActive ? 'active' : 'paused'}
                        onChange={(e) =>
                          setIncomeTemplates((curr) =>
                            curr.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    isActive: e.target.value === 'active',
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <label className="text-muted-foreground text-sm">Anchor Date</label>
                      <Input
                        type="date"
                        value={template.anchorDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setIncomeTemplates((curr) =>
                            curr.map((item, i) =>
                              i === index ? { ...item, anchorDate: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground text-sm">Start</label>
                      <Input
                        type="date"
                        value={template.startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setIncomeTemplates((curr) =>
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setIncomeTemplates((curr) =>
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
                    {template.scheduleType === 'monthly' ? (
                      <div>
                        <label className="text-muted-foreground text-sm">Monthly Day</label>
                        <Input
                          type="number"
                          value={template.monthlyDayOfMonth ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setIncomeTemplates((curr) =>
                              curr.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      monthlyDayOfMonth: Number(e.target.value || 1),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {template.scheduleType === 'semimonthly' ? (
                      <>
                        <div>
                          <label className="text-muted-foreground text-sm">Day 1</label>
                          <Input
                            type="number"
                            value={template.semiMonthlyDay1 ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setIncomeTemplates((curr) =>
                                curr.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        semiMonthlyDay1: Number(e.target.value || 1),
                                      }
                                    : item,
                                ),
                              )
                            }
                            className={
                              attemptedSave && errors.semiMonthlyDays ? 'border-destructive' : ''
                            }
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground text-sm">Day 2</label>
                          <Input
                            type="number"
                            value={template.semiMonthlyDay2 ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setIncomeTemplates((curr) =>
                                curr.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        semiMonthlyDay2: Number(e.target.value || 15),
                                      }
                                    : item,
                                ),
                              )
                            }
                            className={
                              attemptedSave && errors.semiMonthlyDays ? 'border-destructive' : ''
                            }
                          />
                          {attemptedSave && errors.semiMonthlyDays ? (
                            <p className="text-destructive mt-1 text-xs">
                              {errors.semiMonthlyDays}
                            </p>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAttemptedSave(false);
                  setIncomeTemplates((curr) => [...curr, defaultIncomeTemplate()]);
                }}
              >
                Add Recurring Income
              </Button>
            </div>
          </div>
        </section>

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
              onClick={() => {
                setAttemptedSave(false);
                setCategoryTemplates((curr) => [...curr, defaultCategoryTemplate()]);
              }}
            >
              Add Recurring Category
            </Button>
          </div>

          <div className="grid gap-4">
            {categoryTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recurring category templates yet.</p>
            ) : null}
            {categoryTemplates.map((template, index) => {
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
                      onClick={() => void handleDeleteCategoryTemplate(template, index)}
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div className="md:col-span-2">
                      <label className="text-muted-foreground text-sm">Name</label>
                      <Input
                        value={template.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCategoryTemplates((curr) =>
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCategoryTemplates((curr) =>
                            curr.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    allocation: Number(e.target.value || 0),
                                  }
                                : item,
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCategoryTemplates((curr) =>
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCategoryTemplates((curr) =>
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
                onClick={() => {
                  setAttemptedSave(false);
                  setCategoryTemplates((curr) => [...curr, defaultCategoryTemplate()]);
                }}
              >
                Add Recurring Category
              </Button>
            </div>
          </div>
        </section>

        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-20 flex justify-end rounded-md border p-3 backdrop-blur">
          <Button
            type="button"
            disabled={saving || loading}
            onClick={() => void handleSaveAllTemplates()}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </BreezeDialog>
  );
};
