'use client';
import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrencyWithCode } from '@/lib/utils';
import {
  getPersonBonusPerYear,
  getPersonPaydaysForMonth,
  getPersonTotalIncome,
  getPaychecksPerYear,
} from '../../lib/plannerMath';
import { computeHouseholdWaterfall, computePersonWaterfall } from '../../lib/paycheck';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useTaxYear from '../../hooks/planner/useTaxYear';
import type { PlannerPerson } from '../../types/person';
import type { PlannerAccount } from '../../types/account';
import type { PaycheckWithholding } from '../../lib/paycheck';

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

/** Household paycheck equation: Base Pay + Bonus = Total − Taxes − Savings − Withholdings = Take-home. */
export function HouseholdPayStats({ people, accounts, withholdings, currencyCode }: PanelProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode, { maximumFractionDigits: 0 });
  const { filingStatus, deductionType } = useCurrentUser();
  const taxTables = useTaxYear(filingStatus);

  const totals = useMemo(() => {
    const wf = computeHouseholdWaterfall(people, accounts, withholdings, taxTables, deductionType);
    const totalIncome = people.reduce((sum, p) => sum + getPersonTotalIncome(p), 0);
    const bonusIncome = people.reduce((sum, p) => sum + getPersonBonusPerYear(p) / 12, 0);
    return {
      totalIncome,
      bonusMonthly: bonusIncome,
      baseMonthly: totalIncome / 12 - bonusIncome,
      taxesMonthly: wf.taxesMonthly,
      savingsMonthly: wf.savingsMonthly,
      withholdingsMonthly: wf.pretaxWithholdingsMonthly + wf.posttaxWithholdingsMonthly,
      takeHomeMonthly: wf.takeHomeMonthly,
    };
  }, [people, accounts, withholdings, taxTables, deductionType]);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-5">
      <Term value={fc(totals.baseMonthly)} label="Base Pay (Monthly)" />
      <Operator>+</Operator>
      <Term value={fc(totals.bonusMonthly)} label="Bonus (Monthly)" />
      <Operator>=</Operator>
      <Term value={fc(totals.totalIncome / 12)} label="Total (Monthly)" emphasized />
      <Operator>−</Operator>
      <Term
        value={fc(totals.taxesMonthly)}
        label={`Taxes (est. ${((totals.taxesMonthly / totals.totalIncome) * 100 || 0).toFixed(0)}% effective)`}
      />
      <Operator>−</Operator>
      <Term value={fc(totals.savingsMonthly)} label="Savings (401k, HSA)" />
      <Operator>−</Operator>
      <Term value={fc(totals.withholdingsMonthly)} label="Withholdings" />
      <Operator>=</Operator>
      <Term
        value={fc(totals.takeHomeMonthly)}
        label="Take-home (Monthly)"
        valueClassName="text-success"
      />
    </div>
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

/** Month-view calendar marking each person's take-home payday and amount. */
export function PaydayCalendar({ people, accounts, withholdings, currencyCode }: PanelProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode, { maximumFractionDigits: 0 });
  const { filingStatus, deductionType } = useCurrentUser();
  const taxTables = useTaxYear(filingStatus);
  const now = new Date();
  const [today] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [monthOffset, setMonthOffset] = useState(0);

  const view = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );

  const calendar = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
    const byDay = new Map<number, { person: PlannerPerson; amount: number }[]>();
    for (const person of people) {
      const wf = computePersonWaterfall(person, accounts, withholdings, taxTables, deductionType);
      const checksPerYear = getPaychecksPerYear(person.payCadence);
      const netPerCheck = wf.takeHomeAnnual / checksPerYear;
      for (const date of getPersonPaydaysForMonth(person, year, month)) {
        const day = date.getDate();
        const entry = { person, amount: netPerCheck };
        byDay.set(day, [...(byDay.get(day) ?? []), entry]);
      }
    }
    return { year, month, lastDay, leadingBlanks, byDay };
  }, [view, people, accounts, withholdings, taxTables, deductionType]);

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

interface PanelProps {
  people: PlannerPerson[];
  accounts: PlannerAccount[];
  withholdings: PaycheckWithholding[];
  currencyCode: string;
}
