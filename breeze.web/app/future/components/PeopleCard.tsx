'use client';
import { useState } from 'react';
import { Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataCard } from '@/components/common/DataCard';
import { HouseholdPayStats, PaydayCalendar } from './people/HouseholdPayPanel';
import { useHouseholdIncomeBreakdown } from '../hooks/planner/useHouseholdIncomeBreakdown';
import { usePlannerState } from '../providers/PlannerStateProvider';
import useTaxYear from '../hooks/planner/useTaxYear';
import {
  computePaycheck,
  isPaycheckConfigured,
  makePaycheckDeduction,
  parsePaycheckConfig,
  serializePaycheckConfig,
} from '../lib/paycheck';
import type { TaxYearTables } from '../types/tax';
import { usePlannerPeople, usePersonMutations } from '../hooks/planner/index';
import { PayCadence, PayType, PlannerPerson } from '../types/person';
import type { PlannerAccount } from '../types/account';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { formatCurrencyWithCode } from '@/lib/utils';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export interface PeopleCardProps {
  collapsed: boolean;
}

const CADENCE_LABELS: Record<PayCadence, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  semimonthly: 'Twice a month',
  monthly: 'Once a month',
};

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const BONUS_FREQUENCY_OPTIONS = [
  { value: 'annual', label: 'Once a year', perYear: 1 },
  { value: 'quarterly', label: 'Quarterly', perYear: 4 },
  { value: 'monthly', label: 'Monthly', perYear: 12 },
] as const;

function payCadenceLabel(cadence: PayCadence): string {
  return CADENCE_LABELS[cadence] ?? cadence;
}

function payDayLabel(person: PlannerPerson): string {
  if (person.payCadence === 'weekly' || person.payCadence === 'biweekly') {
    const weekday = WEEKDAYS[person.payDay - 1];
    return weekday ? ` · ${weekday}` : '';
  }
  return ` · payday ${person.payDay}`;
}

const PeopleCard = ({ collapsed }: PeopleCardProps) => {
  const { userId, currencyCode, inflationRate, filingStatus, deductionType } = useCurrentUser();
  const { people, updatePerson, addPerson, removePerson } = usePlannerPeople();
  const { plannerAccounts } = usePlannerState();
  const taxTables = useTaxYear(filingStatus);
  const incomeBreakdown = useHouseholdIncomeBreakdown(people, plannerAccounts);
  const { upsertPersonMutation, deletePersonMutation } = usePersonMutations(userId);

  const [editingPerson, setEditingPerson] = useState<PlannerPerson | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<PlannerPerson | null>(null);

  // The modal must always render the live person object — edits update the
  // array immutably, so the snapshot captured at pencil-click goes stale.
  const editingLive = editingPerson
    ? (people.find((p) => p.id === editingPerson.id) ?? null)
    : null;

  useAutoSave(() => {
    if (people.length === 0) return;
    for (const person of people) {
      upsertPersonMutation.mutate(person);
    }
  }, [people]);

  const handleAddPerson = () => {
    addPerson();
    setShowAddModal(true);
  };

  const handleSaveNewPerson = () => {
    setShowAddModal(false);
  };

  const handleSaveAndAddAnother = () => {
    addPerson();
  };

  const handleDeletePerson = (person: PlannerPerson) => {
    deletePersonMutation.mutate(person.id);
    removePerson(person.id);
    setDeletingPerson(null);
  };

  if (collapsed) return null;

  return (
    <>
      <div className="space-y-4">
        <HouseholdPayStats
          people={people}
          currencyCode={currencyCode}
          breakdown={incomeBreakdown}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <PersonSummaryCard
              key={person.id}
              person={person}
              currencyCode={currencyCode}
              taxTables={taxTables}
              deductionType={deductionType}
              onEdit={() => setEditingPerson(person)}
              onDelete={() => setDeletingPerson(person)}
              canRemove={people.length > 1}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={handleAddPerson}>
            Add Person
          </Button>
        </div>

        <PaydayCalendar
          people={people}
          currencyCode={currencyCode}
          netRatio={incomeBreakdown.netRatio}
        />
      </div>

      {/* Edit Modal */}
      {editingLive && (
        <PersonFormModal
          key={editingLive.id}
          person={editingLive}
          accounts={plannerAccounts}
          taxTables={taxTables}
          deductionType={deductionType}
          inflationRate={inflationRate}
          onUpdate={(updater) => {
            const editingId = editingLive.id;
            updatePerson(editingId, (current) => {
              const updated = updater(current);
              if (updated.isPrimary && !current.isPrimary) {
                for (const other of people) {
                  if (other.id !== editingId && other.isPrimary) {
                    updatePerson(other.id, (p) => ({ ...p, isPrimary: false }));
                  }
                }
              }
              return updated;
            });
          }}
          onClose={() => setEditingPerson(null)}
          mode="edit"
        />
      )}

      {/* Add Modal */}
      {showAddModal && people.length > 0 && (
        <PersonFormModal
          key={people[people.length - 1].id}
          person={people[people.length - 1]}
          accounts={plannerAccounts}
          taxTables={taxTables}
          deductionType={deductionType}
          inflationRate={inflationRate}
          onUpdate={(updater) => updatePerson(people[people.length - 1].id, updater)}
          onClose={handleSaveNewPerson}
          onSaveAndAddAnother={handleSaveAndAddAnother}
          mode="add"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingPerson !== null}
        onOpenChange={(open) => !open && setDeletingPerson(null)}
        title="Remove Person"
        description={`Are you sure you want to remove ${deletingPerson?.name || 'this person'}? Their accounts will need to be reassigned.`}
        confirmLabel="Remove"
        onConfirm={() => deletingPerson && handleDeletePerson(deletingPerson)}
      />
    </>
  );
};

function PersonSummaryCard({
  person,
  currencyCode,
  taxTables,
  deductionType,
  onEdit,
  onDelete,
  canRemove,
}: {
  person: PlannerPerson;
  currencyCode: string;
  taxTables: TaxYearTables | null;
  deductionType: string;
  onEdit: () => void;
  onDelete: () => void;
  canRemove: boolean;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode, { maximumFractionDigits: 0 });
  const perYear =
    BONUS_FREQUENCY_OPTIONS.find(
      (o) => o.value === (person.bonusFrequency ?? 'annual'),
    )?.perYear ?? 1;
  const bonusDollars =
    person.bonusMode === 'salary-percent'
      ? Math.round((person.annualSalary * person.annualBonus * perYear) / 100)
      : person.annualBonus;
  // Total income includes both fixed and percentage bonuses.
  const totalIncome = person.annualSalary + bonusDollars;

  const basePay =
    person.payType === 'hourly'
      ? `${fc(person.hourlyRate)}/hr × ${person.expectedHoursPerWeek} hrs/wk`
      : fc(person.annualSalary);

  let bonusLine = 'No bonus';
  if (person.annualBonus > 0) {
    if (person.bonusMode === 'salary-percent') {
      bonusLine =
        perYear > 1
          ? `Bonus: ${person.annualBonus}% of salary × ${perYear}/yr (${fc(bonusDollars)})`
          : `Bonus: ${person.annualBonus}% of salary (${fc(bonusDollars)})`;
    } else if (perYear > 1) {
      bonusLine = `Bonus: ${fc(person.annualBonus / perYear)} × ${perYear}/yr (${fc(bonusDollars)})`;
    } else {
      bonusLine = `Bonus: ${fc(person.annualBonus)}`;
    }
  }

  const takeHome =
    isPaycheckConfigured(person)
      ? computePaycheck(person, taxTables, deductionType).netPerCheck
      : null;
  const summaryLines = [
    ...(takeHome !== null ? [`Take-home: ${fc(takeHome)}/check`] : []),
    `Base pay: ${basePay}`,
    bonusLine,
    `Total: ${fc(totalIncome)}/yr`,
    `Growth: ${person.incomeGrowthRate}%`,
    `${payCadenceLabel(person.payCadence)}${payDayLabel(person)}`,
  ];

  return (
    <DataCard
      icon={<UserRound className="size-4" />}
      iconVariant="muted"
      name={person.name || 'Unnamed'}
      value={`${fc(totalIncome)}/yr`}
      badges={person.isPrimary ? [{ label: 'Primary' }] : undefined}
      summaryLines={summaryLines}
      updatedAt={person.updatedAt}
      onEdit={onEdit}
      onDelete={onDelete}
      canDelete={canRemove}
    />
  );
}

function PersonFormModal({
  person,
  accounts,
  taxTables,
  deductionType,
  inflationRate,
  onUpdate,
  onClose,
  onSaveAndAddAnother,
  mode,
}: {
  person: PlannerPerson;
  accounts: PlannerAccount[];
  taxTables: TaxYearTables | null;
  deductionType: string;
  inflationRate: number;
  onUpdate: (updater: (current: PlannerPerson) => PlannerPerson) => void;
  onClose: () => void;
  onSaveAndAddAnother?: () => void;
  mode: 'edit' | 'add';
}) {
  const paycheckConfig = parsePaycheckConfig(person.paycheck);
  const computation = computePaycheck(person, taxTables, deductionType);

  const updateConfig = (next: typeof paycheckConfig) =>
    onUpdate((c) => ({ ...c, paycheck: serializePaycheckConfig(next) }));
  const updateDeduction = (
    id: string,
    u: (d: ReturnType<typeof makePaycheckDeduction>) => ReturnType<typeof makePaycheckDeduction>,
  ) =>
    updateConfig({
      ...paycheckConfig,
      deductions: paycheckConfig.deductions.map((d) => (d.id === id ? u(d) : d)),
    });
  const addDeduction = () =>
    updateConfig({
      ...paycheckConfig,
      deductions: [...paycheckConfig.deductions, makePaycheckDeduction()],
    });
  const removeDeduction = (id: string) =>
    updateConfig({
      ...paycheckConfig,
      deductions: paycheckConfig.deductions.filter((d) => d.id !== id),
    });
  // Growth presets are relative to the user's saved inflation preference.
  const growthOptions = [
    { value: 0, label: 'No growth (0%)' },
    { value: inflationRate, label: `Low — matches inflation (≈${inflationRate.toFixed(1)}%)` },
    {
      value: inflationRate + 1.5,
      label: `Medium (≈${(inflationRate + 1.5).toFixed(1)}%)`,
    },
    {
      value: inflationRate + 3,
      label: `High (≈${(inflationRate + 3).toFixed(1)}%)`,
    },
  ];
  const growthOptionIndex = growthOptions.findIndex(
    (o) => Math.abs(o.value - person.incomeGrowthRate) < 0.0001,
  );
  const growthSelectValue = growthOptionIndex >= 0 ? String(growthOptionIndex) : 'custom';
  const isWeeklyish =
    person.payCadence === 'weekly' || person.payCadence === 'biweekly';

  // Custom growth rate entry: true once the user picks Custom from the dropdown.
  const [customGrowth, setCustomGrowth] = useState(false);

  // Bonus frequency: annualBonus stores the annual-equivalent so projections
  // need no changes; the form works in per-occurrence amounts.
  const bonusFrequency = person.bonusFrequency ?? 'annual';
  const bonusPerYear =
    BONUS_FREQUENCY_OPTIONS.find((o) => o.value === bonusFrequency)?.perYear ?? 1;
  const bonusPerOccurrence = person.annualBonus / bonusPerYear;
  const bonusSelectValue =
    person.annualBonus > 0
      ? person.bonusMode === 'salary-percent'
        ? 'salary-percent'
        : 'dollars'
      : 'none';

  const handleBonusTypeChange = (v: string) => {
    if (v === 'none') {
      onUpdate((c) => ({ ...c, bonusMode: 'dollars', annualBonus: 0 }));
    } else if (v === 'salary-percent') {
      onUpdate((c) => ({ ...c, bonusMode: 'salary-percent', annualBonus: c.annualBonus || 5 }));
    } else {
      onUpdate((c) => ({ ...c, bonusMode: 'dollars', annualBonus: c.annualBonus || 5000 }));
    }
  };

  const handleBonusFrequencyChange = (v: string) => {
    const nextPerYear =
      BONUS_FREQUENCY_OPTIONS.find((o) => o.value === v)?.perYear ?? 1;
    const perOcc = person.annualBonus / bonusPerYear;
    onUpdate((c) => ({
      ...c,
      bonusFrequency: v as PlannerPerson['bonusFrequency'],
      annualBonus: Math.round(perOcc * nextPerYear * 100) / 100,
    }));
  };

  const handleBonusAmountChange = (v: number) => {
    onUpdate((c) => ({
      ...c,
      annualBonus: Math.round(v * bonusPerYear * 100) / 100,
    }));
  };

  const bonusAmountLabel =
    person.bonusMode === 'salary-percent'
      ? 'Bonus (% of Salary)'
      : bonusFrequency === 'quarterly'
        ? 'Bonus Amount (per quarter, $)'
        : bonusFrequency === 'monthly'
          ? 'Bonus Amount (per month, $)'
          : 'Annual Bonus ($)';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? `Edit ${person.name || 'Person'}` : 'Add Person'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? "Update the person's details below."
              : 'Fill in the details for the new household member.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* -- Personal ------------------------------------------------ */}
          <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase sm:col-span-2">
            Personal
          </p>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={person.name}
              onChange={(e) => onUpdate((c) => ({ ...c, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Birthday</Label>
            <Input
              type="date"
              value={person.birthday}
              onChange={(e) => onUpdate((c) => ({ ...c, birthday: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Retirement Age</Label>
            <FormattedNumberInput
              value={person.retirementAge}
              onValueChange={(v) => onUpdate((c) => ({ ...c, retirementAge: v }))}
              maxFractionDigits={0}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              className="accent-primary"
              checked={person.isPrimary}
              onChange={(e) => onUpdate((c) => ({ ...c, isPrimary: e.target.checked }))}
            />
            <Label htmlFor="isPrimary" className="cursor-pointer text-sm">
              Primary household member
            </Label>
          </div>

          {/* -- Paycheck ------------------------------------------------- */}
          <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase sm:col-span-2">
            Paycheck
          </p>
          <div className="space-y-2">
            <Label>Pay Type</Label>
            <Select
              value={person.payType}
              onValueChange={(v) => onUpdate((c) => ({ ...c, payType: v as PayType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {person.payType !== 'hourly' ? (
            <div className="space-y-2">
              <Label>
                {person.payType === 'commission' ? 'Expected Annual Income' : 'Annual Salary'}
              </Label>
              <FormattedNumberInput
                value={person.annualSalary}
                onValueChange={(v) => onUpdate((c) => ({ ...c, annualSalary: v }))}
                maxFractionDigits={0}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <FormattedNumberInput
                  value={person.hourlyRate}
                  onValueChange={(v) => onUpdate((c) => ({ ...c, hourlyRate: v }))}
                  maxFractionDigits={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Hours/Week</Label>
                <FormattedNumberInput
                  value={person.expectedHoursPerWeek}
                  onValueChange={(v) => onUpdate((c) => ({ ...c, expectedHoursPerWeek: v }))}
                  maxFractionDigits={0}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Pay Cadence</Label>
            <Select
              value={person.payCadence}
              onValueChange={(v) => onUpdate((c) => ({ ...c, payCadence: v as PayCadence }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadence" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CADENCE_LABELS) as PayCadence[]).map((cadence) => (
                  <SelectItem key={cadence} value={cadence}>
                    {CADENCE_LABELS[cadence]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {isWeeklyish ? (
              <>
                <Label>Paid On</Label>
                <Select
                  value={
                    person.payDay >= 1 && person.payDay <= 7 ? String(person.payDay) : undefined
                  }
                  onValueChange={(v) => onUpdate((c) => ({ ...c, payDay: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payday" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day, i) => (
                      <SelectItem key={day} value={String(i + 1)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Label>
                  {person.payCadence === 'semimonthly'
                    ? 'First Payday of Month (1–15)'
                    : 'Pay Day (1-28)'}
                </Label>
                <FormattedNumberInput
                  value={person.payDay}
                  onValueChange={(v) =>
                    onUpdate((c) => ({
                      ...c,
                      payDay: Math.min(
                        person.payCadence === 'semimonthly' ? 15 : 28,
                        Math.max(1, v),
                      ),
                    }))
                  }
                  maxFractionDigits={0}
                />
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label>Gross per Check (optional override)</Label>
            <FormattedNumberInput
              value={paycheckConfig.grossPerCheck ?? 0}
              onValueChange={(v) =>
                updateConfig({ ...paycheckConfig, grossPerCheck: v > 0 ? v : null })
              }
              maxFractionDigits={2}
            />
            <p className="text-muted-foreground text-xs">
              Leave 0 to derive from annual pay ({formatCurrencyWithCode(computation.grossPerCheck, 'USD')} per
              check at {computation.checksPerYear}/yr).
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Income Growth</Label>
            <Select
              value={growthSelectValue}
              onValueChange={(v) => {
                if (v === 'custom') {
                  setCustomGrowth(true);
                  return;
                }
                setCustomGrowth(false);
                const option = growthOptions[Number(v)];
                if (option) onUpdate((c) => ({ ...c, incomeGrowthRate: option.value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select growth rate" />
              </SelectTrigger>
              <SelectContent>
                {growthOptions.map((opt, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {opt.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  Custom ({person.incomeGrowthRate.toFixed(1)}%)
                </SelectItem>
              </SelectContent>
            </Select>
            {(customGrowth || growthOptionIndex < 0) && (
              <FormattedNumberInput
                value={person.incomeGrowthRate}
                onValueChange={(v) => onUpdate((c) => ({ ...c, incomeGrowthRate: v }))}
                maxFractionDigits={2}
              />
            )}
            <p className="text-muted-foreground text-xs">
              Low matches your inflation preference; Medium and High add raises above inflation.
            </p>
          </div>

          {/* -- Bonus ---------------------------------------------------- */}
          <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase sm:col-span-2">
            Bonus
          </p>
          <div className="space-y-2">
            <Label>Bonus Type</Label>
            <Select value={bonusSelectValue} onValueChange={handleBonusTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select bonus type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No bonus</SelectItem>
                <SelectItem value="dollars">Fixed amount ($)</SelectItem>
                <SelectItem value="salary-percent">% of salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bonusSelectValue !== 'none' && (
            <>
              <div className="space-y-2">
                <Label>How Often</Label>
                <Select
                  value={bonusFrequency}
                  onValueChange={handleBonusFrequencyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {BONUS_FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{bonusAmountLabel}</Label>
                <FormattedNumberInput
                  value={bonusPerOccurrence}
                  onValueChange={handleBonusAmountChange}
                  maxFractionDigits={person.bonusMode === 'salary-percent' ? 2 : 0}
                />
                <p className="text-muted-foreground text-xs">
                  {person.bonusMode === 'salary-percent'
                    ? `Percent of salary each bonus. ≈ ${formatCurrencyWithCode(
                        Math.round((person.annualSalary * person.annualBonus) / 100),
                        'USD',
                      )}/yr`
                    : `≈ ${formatCurrencyWithCode(
                        person.annualBonus,
                        'USD',
                      )}/yr after-tax take-home.`}
                </p>
              </div>
            </>
          )}

          {/* -- Deductions ----------------------------------------------- */}
          <div className="space-y-3 sm:col-span-2">
            <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase">
              Deductions
            </p>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                modeled per paycheck — 401(k), HSA, insurance…
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                + Add Deduction
              </Button>
            </div>
            {paycheckConfig.deductions.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No deductions — net equals gross minus estimated taxes.
              </p>
            )}
            <div className="space-y-2">
              {paycheckConfig.deductions.map((d) => (
                <div key={d.id} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-36 flex-1 space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={d.name}
                      onChange={(e) =>
                        updateDeduction(d.id, (dd) => ({ ...dd, name: e.target.value }))
                      }
                      placeholder="401(k), HSA, Health Insurance…"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <FormattedNumberInput
                      value={d.amount}
                      onValueChange={(v) => updateDeduction(d.id, (dd) => ({ ...dd, amount: v }))}
                      maxFractionDigits={2}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={d.pretax}
                      onChange={(e) =>
                        updateDeduction(d.id, (dd) => ({ ...dd, pretax: e.target.checked }))
                      }
                    />
                    Pre-tax
                  </label>
                  <div className="w-44 space-y-1 pb-0.5">
                    <Select
                      value={d.linkedAccountId ?? 'none'}
                      onValueChange={(v) =>
                        updateDeduction(d.id, (dd) => ({
                          ...dd,
                          linkedAccountId: v === 'none' ? null : v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Links to account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked account</SelectItem>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name || 'Unnamed account'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-8"
                    onClick={() => removeDeduction(d.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* -- Totals --------------------------------------------------- */}
          <div className="space-y-3 sm:col-span-2">
            <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase">
              Totals
            </p>
            <div className="bg-muted/50 space-y-1 rounded-md px-3 py-2 text-xs">
              <p>
                Gross {formatCurrencyWithCode(computation.grossPerCheck, 'USD')} · Pre-tax{' '}
                {formatCurrencyWithCode(computation.pretaxPerCheck, 'USD')} · Taxes (est.{' '}
                {(computation.taxRate * 100).toFixed(1)}%){' '}
                {formatCurrencyWithCode(computation.taxesPerCheck, 'USD')} · Post-tax{' '}
                {formatCurrencyWithCode(computation.posttaxPerCheck, 'USD')}
              </p>
              <p className="text-success font-semibold">
                Net {formatCurrencyWithCode(computation.netPerCheck, 'USD')} per check ×{' '}
                {computation.checksPerYear}/yr ={' '}
                {formatCurrencyWithCode(computation.netAnnual, 'USD')}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {mode === 'edit' ? 'Done' : 'Cancel'}
          </Button>
          {mode === 'add' && onSaveAndAddAnother && (
            <Button variant="outline" onClick={onSaveAndAddAnother}>
              Save & Add Another
            </Button>
          )}
          {mode === 'add' && <Button onClick={onClose}>Save</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PeopleCard;
