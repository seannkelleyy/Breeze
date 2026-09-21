'use client';
import { UserRound } from 'lucide-react';
import { DataCard } from '@/components/common/DataCard';
import { formatCurrencyWithCode } from '@/lib/utils';
import {
  computePersonWaterfall,
  getPersonSavingsAccounts,
  type PaycheckWithholding,
} from '../../lib/paycheck';
import type { TaxYearTables } from '../../types/tax';
import { PayCadence, PlannerPerson } from '../../types/person';
import type { PlannerAccount } from '../../types/account';

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

export function PersonSummaryCard({
  person,
  accounts,
  withholdings,
  taxTables,
  deductionType,
  currencyCode,
  onEdit,
  onDelete,
  canRemove,
}: {
  person: PlannerPerson;
  accounts: PlannerAccount[];
  withholdings: PaycheckWithholding[];
  taxTables: TaxYearTables | null;
  deductionType: string;
  currencyCode: string;
  onEdit: () => void;
  onDelete: () => void;
  canRemove: boolean;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode, { maximumFractionDigits: 0 });
  const perYear =
    BONUS_FREQUENCY_OPTIONS.find((o) => o.value === (person.bonusFrequency ?? 'annual'))?.perYear ??
    1;
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

  const wf = computePersonWaterfall(person, accounts, withholdings, taxTables, deductionType);
  const ownedSavings = getPersonSavingsAccounts(person, accounts);
  const savingsLine =
    ownedSavings.length > 0
      ? `Savings: ${ownedSavings.map((a) => a.name || 'Unnamed').join(', ')}`
      : 'Savings: none';
  const summaryLines = [
    `Take-home: ${fc(wf.takeHomeMonthly)}/mo`,
    `Base pay: ${basePay}`,
    bonusLine,
    savingsLine,
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
