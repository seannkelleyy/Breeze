'use client';
import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrencyWithCode } from '@/lib/utils';
import {
  getRecurringExpensesMonthlyTotal,
  useRecurringExpenseTemplates,
} from '@/app/budget/hooks/recurring/recurringTemplateServices';
import {
  getPersonBonusPerYear,
  getPersonPaycheckAmount,
  getPersonPaydaysForMonth,
  getPersonTotalIncome,
} from '../../lib/plannerMath';
import { computePaycheck, isPaycheckConfigured } from '../../lib/paycheck';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useTaxYear from '../../hooks/planner/useTaxYear';
import type { PlannerPerson } from '../../types/person';
import type { HouseholdIncomeBreakdown } from '../../hooks/planner/useHouseholdIncomeBreakdown';

type CalendarDayEntry = { person: PlannerPerson; amount: number };

function buildPaydayCalendar(
  people: PlannerPerson[],
  view: Date,
  amountFor: (person: PlannerPerson) => number,
): {
  year: number;
  month: number;
  lastDay: number;
  leadingBlanks: number;
  byDay: Map<number, CalendarDayEntry[]>;
} {
  const year = view.getFullYear();
  const month = view.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const byDay = new Map<number, CalendarDayEntry[]>();
  for (const person of people) {
    for (const date of getPersonPaydaysForMonth(person, year, month)) {
      const day = date.getDate();
      const entry = {
        person,
        amount: amountFor(person),
      };
      byDay.set(day, [...(byDay.get(day) ?? []), entry]);
    }
  }
  return { year, month, lastDay, leadingBlanks, byDay };
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Household income as an equation: Base Pay + Bonus = Gross − Pre-Tax − Taxes = Net. */
export function HouseholdPayStats({
  people,
  currencyCode,
  breakdown,
}: HouseholdPayPanelProps & { breakdown: HouseholdIncomeBreakdown }) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode, { maximumFractionDigits: 0 });

  const totals = useMemo(() => {
    let totalIncome = 0;
    let bonusIncome = 0;
    for (const person of people) {
      totalIncome += getPersonTotalIncome(person);
      bonusIncome += getPersonBonusPerYear(person);
    }
    return { totalIncome, bonusIncome, baseIncome: totalIncome - bonusIncome };
  }, [people]);

  const { data: recurringExpenseTemplates } = useRecurringExpenseTemplates();
  const monthlyExpenses = getRecurringExpensesMonthlyTotal(recurringExpenseTemplates ?? []);
  const baseMonthly = totals.baseIncome / 12;
  const bonusMonthly = totals.bonusIncome / 12;
  const grossMonthly = breakdown.grossAnnual / 12;
  const preTaxMonthly = breakdown.preTaxAnnual / 12;
  const taxableMonthly = breakdown.taxableAnnual / 12;
  const taxMonthly = breakdown.taxAnnual / 12;
  const netMonthly = breakdown.netAnnual / 12;
  const leftover = netMonthly - monthlyExpenses;

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-5">
          <Term value={fc(baseMonthly)} label="Base Pay (Monthly)" />
          <Operator>+</Operator>
          <Term value={fc(bonusMonthly)} label="Bonus (Monthly)" />
          <Operator>=</Operator>
          <Term value={fc(grossMonthly)} label="Gross (Monthly)" />
          {breakdown.preTaxAnnual > 0 && (
            <>
              <Operator>−</Operator>
              <Term value={fc(preTaxMonthly)} label="401(k) / HSA (Pre-Tax)" />
              <Operator>=</Operator>
              <Term value={fc(taxableMonthly)} label="Taxable (Monthly)" emphasized />
            </>
          )}
          <Operator>−</Operator>
          <Term
            value={fc(taxMonthly)}
            label={`Taxes (est. ${(breakdown.effectiveRate * 100).toFixed(0)}% of taxable)`}
          />
          <Operator>=</Operator>
          <Term
            value={fc(netMonthly)}
            label="Net (Monthly) — planning figure"
            emphasized
            valueClassName="text-success"
          />
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          Net is what lands in bank accounts. After {fc(monthlyExpenses)}/mo tracked expenses,{' '}
          {fc(leftover)}/mo remains for saving and investing.
        </p>
      </CardContent>
    </Card>
  );
}

function Term({
  value,
  label,
  emphasized = false,
  valueClassName,
}: {
  value: string;
  label: string;
  emphasized?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className={cn('text-xl font-semibold', emphasized && 'text-2xl', valueClassName)}>
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function Operator({ children }: { children: string }) {
  return <span className="text-muted-foreground self-center text-2xl font-light">{children}</span>;
}

/** Month-view calendar marking each person's after-tax payday and amount. */
export function PaydayCalendar({
  people,
  currencyCode,
  netRatio = 1,
}: HouseholdPayPanelProps & { netRatio?: number }) {
  const { filingStatus, deductionType } = useCurrentUser();
  const taxTables = useTaxYear(filingStatus);
  // Configured paychecks use their computed take-home; others scale gross by the
  // household net ratio.
  const amountFor = (person: PlannerPerson): number =>
    isPaycheckConfigured(person)
      ? computePaycheck(person, taxTables, deductionType).netPerCheck
      : getPersonPaycheckAmount(person) * netRatio;
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode, { maximumFractionDigits: 0 });
  const now = new Date();
  const [today] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [monthOffset, setMonthOffset] = useState(0);

  const view = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );

  const calendar = buildPaydayCalendar(people, view, amountFor);

  return (
    <Card className="bg-muted/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <CalendarDays className="size-4" />
            Payday Calendar
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setMonthOffset((m) => m - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="w-36 text-center text-sm font-medium">
              {MONTH_NAMES[calendar.month]} {calendar.year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setMonthOffset((m) => m + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_HEADERS.map((d) => (
            <p
              key={d}
              className="text-muted-foreground pb-1 text-center text-[10px] font-medium uppercase"
            >
              {d}
            </p>
          ))}
          {Array.from({ length: calendar.leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: calendar.lastDay }, (_, i) => i + 1).map((day) => {
            const entries = calendar.byDay.get(day) ?? [];
            const isToday =
              day === today.getDate() &&
              calendar.month === today.getMonth() &&
              calendar.year === today.getFullYear();
            return (
              <div
                key={day}
                className={cn(
                  'min-h-16 rounded-md border p-1.5',
                  isToday && 'border-primary/50 bg-primary/5',
                )}
              >
                <p
                  className={cn(
                    'text-xs font-medium',
                    isToday ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {day}
                </p>
                <div className="mt-0.5 space-y-0.5">
                  {entries.slice(0, 2).map((entry, i) => (
                    <div
                      key={`${entry.person.id}-${i}`}
                      className="bg-success/10 text-success rounded px-1 py-0.5 text-[10px] leading-tight"
                    >
                      <span className="block truncate font-medium">
                        {entry.person.name || 'Unnamed'}
                      </span>
                      <span className="block truncate">{fc(entry.amount)}</span>
                    </div>
                  ))}
                  {entries.length > 2 && (
                    <p className="text-muted-foreground text-[10px]">+{entries.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {calendar.byDay.size === 0 && (
          <p className="text-muted-foreground text-center text-xs">
            No paydays this month — set a pay cadence on a person to see paydays here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface HouseholdPayPanelProps {
  people: PlannerPerson[];
  currencyCode: string;
}
