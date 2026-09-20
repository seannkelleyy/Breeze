'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
import {
  computePersonWaterfall,
  WITHHOLDING_KIND_OPTIONS,
  type PaycheckWithholding,
} from '../../lib/paycheck';
import { usePaycheckDeductions } from '../../hooks/planner/usePaycheckDeductions';
import { SavingsAccountsSection } from './SavingsAccountsSection';
import type { TaxYearTables } from '../../types/tax';
import { PayCadence, PayType, PlannerPerson } from '../../types/person';
import type { PlannerAccount } from '../../types/account';
import { formatCurrencyWithCode } from '@/lib/utils';

const CADENCE_LABELS: Record<PayCadence, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  semimonthly: 'Twice a month',
  monthly: 'Once a month',
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BONUS_FREQUENCY_OPTIONS = [
  { value: 'annual', label: 'Once a year', perYear: 1 },
  { value: 'quarterly', label: 'Quarterly', perYear: 4 },
  { value: 'monthly', label: 'Monthly', perYear: 12 },
] as const;

export function PersonFormModal({
  person,
  people,
  accounts,
  currencyCode,
  taxTables,
  deductionType,
  inflationRate,
  onUpdate,
  onClose,
  onSaveAndAddAnother,
  mode,
}: {
  person: PlannerPerson;
  people: PlannerPerson[];
  accounts: PlannerAccount[];
  currencyCode: string;
  taxTables: TaxYearTables | null;
  deductionType: string;
  inflationRate: number;
  onUpdate: (updater: (current: PlannerPerson) => PlannerPerson) => void;
  onClose: () => void;
  onSaveAndAddAnother?: () => void;
  mode: 'edit' | 'add';
}) {
  // Per-person withholdings (insurance, FSA…) live server-side.
  const {
    deductions: withholdings,
    upsertDeduction,
    deleteDeduction,
  } = usePaycheckDeductions(person.id);
  const [withholdingDrafts, setWithholdingDrafts] = useState<Record<string, PaycheckWithholding>>(
    {},
  );
  const draftFor = (row: PaycheckWithholding): PaycheckWithholding =>
    withholdingDrafts[row.id] ?? row;
  const updateDraft = (row: PaycheckWithholding) =>
    setWithholdingDrafts((prev) => ({ ...prev, [row.id]: row }));
  const commitWithholding = (row: PaycheckWithholding) => {
    upsertDeduction.mutate({
      id: row.id,
      personId: person.id,
      name: row.name,
      amount: row.amount,
      pretax: row.pretax,
      kind: row.kind,
      linkedAccountId: row.linkedAccountId,
    });
    setWithholdingDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
  };
  const addWithholding = () => {
    const row: PaycheckWithholding = {
      id: crypto.randomUUID(),
      personId: person.id,
      name: '',
      amount: 0,
      pretax: true,
      kind: 'OTHER',
      linkedAccountId: null,
    };
    setWithholdingDrafts((prev) => ({ ...prev, [row.id]: row }));
  };
  const removeWithholding = (row: PaycheckWithholding) => {
    deleteDeduction.mutate(row.id);
    setWithholdingDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
  };

  // Live waterfall including uncommitted drafts.
  const mergedWithholdings: PaycheckWithholding[] = [
    ...withholdings.map((w) => withholdingDrafts[w.id] ?? w),
    ...Object.values(withholdingDrafts).filter((d) => !withholdings.some((w) => w.id === d.id)),
  ];
  const wf = computePersonWaterfall(person, accounts, mergedWithholdings, taxTables, deductionType);

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
  const isWeeklyish = person.payCadence === 'weekly' || person.payCadence === 'biweekly';

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
    const nextPerYear = BONUS_FREQUENCY_OPTIONS.find((o) => o.value === v)?.perYear ?? 1;
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
                <Select value={bonusFrequency} onValueChange={handleBonusFrequencyChange}>
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
                Insurance, FSA and other withholdings — saved per person, no account needed.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addWithholding}>
                + Add Withholding
              </Button>
            </div>
            {withholdings.length === 0 && Object.keys(withholdingDrafts).length === 0 && (
              <p className="text-muted-foreground text-xs">
                No withholdings — take-home equals gross minus estimated taxes.
              </p>
            )}
            <div className="space-y-2">
              {(Object.values(withholdingDrafts).length > 0
                ? withholdings
                    .map((w) => withholdingDrafts[w.id] ?? w)
                    .concat(
                      Object.values(withholdingDrafts).filter(
                        (d) => !withholdings.some((w) => w.id === d.id),
                      ),
                    )
                : withholdings
              )
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((row) => {
                  const d = draftFor(row);
                  return (
                    <div key={d.id} className="flex flex-wrap items-end gap-2">
                      <div className="min-w-36 flex-1 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={d.name}
                          onChange={(e) => updateDraft({ ...d, name: e.target.value })}
                          onBlur={() => commitWithholding(d)}
                          placeholder="Health Insurance, FSA…"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">Amount / mo</Label>
                        <FormattedNumberInput
                          value={d.amount}
                          onValueChange={(v) => updateDraft({ ...d, amount: v })}
                          maxFractionDigits={2}
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">Kind</Label>
                        <Select
                          value={
                            WITHHOLDING_KIND_OPTIONS.some((o) => o.value === d.kind)
                              ? d.kind
                              : 'OTHER'
                          }
                          onValueChange={(v) => {
                            const next = { ...d, kind: v };
                            updateDraft(next);
                            commitWithholding(next);
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WITHHOLDING_KIND_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-xs">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={d.pretax}
                          onChange={(e) => {
                            const next = { ...d, pretax: e.target.checked };
                            updateDraft(next);
                            commitWithholding(next);
                          }}
                        />
                        Pre-tax
                      </label>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="size-8"
                        onClick={() => removeWithholding(d)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* -- Savings Accounts ------------------------------------------ */}
          <div className="space-y-2 sm:col-span-2">
            <SavingsAccountsSection person={person} people={people} currencyCode={currencyCode} />
          </div>

          {/* -- Totals --------------------------------------------------- */}
          <div className="space-y-3 sm:col-span-2">
            <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase">
              Totals
            </p>
            <div className="bg-muted/50 space-y-1 rounded-md px-3 py-2 text-xs">
              <p>
                Gross {formatCurrencyWithCode(wf.grossMonthly, 'USD')} − Pre-tax savings{' '}
                {formatCurrencyWithCode(wf.pretaxSavingsMonthly, 'USD')} − Pre-tax withholdings{' '}
                {formatCurrencyWithCode(wf.pretaxWithholdingsMonthly, 'USD')} = Taxable{' '}
                {formatCurrencyWithCode(wf.taxableMonthly, 'USD')}
              </p>
              <p>
                Taxes (est. {(wf.effectiveRate * 100).toFixed(1)}%){' '}
                {formatCurrencyWithCode(wf.taxesMonthly, 'USD')} − Savings{' '}
                {formatCurrencyWithCode(wf.savingsMonthly, 'USD')} − Post-tax withholdings{' '}
                {formatCurrencyWithCode(wf.posttaxWithholdingsMonthly, 'USD')}
              </p>
              <p className="text-success font-semibold">
                Take-home {formatCurrencyWithCode(wf.takeHomeMonthly, 'USD')} per month × 12 ={' '}
                {formatCurrencyWithCode(wf.takeHomeAnnual, 'USD')}
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
