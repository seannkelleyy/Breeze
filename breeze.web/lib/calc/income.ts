/**
 * Canonical income family — the only place annual income is defined.
 * Every displayed income figure must flow through these functions.
 *
 * Storage contract (PlannerPerson.annualBonus): the ANNUAL-EQUIVALENT — the
 * yearly total in both modes. Dollars mode stores dollars per year; percent
 * mode stores the total percent of base pay per year. Frequency affects only
 * per-occurrence display and payday-calendar timing, never totals.
 */
import type { PlannerPerson } from '@/app/future/types/person';

export const getPersonBaseAnnualIncome = (person: PlannerPerson): number =>
  person.payType === 'hourly'
    ? person.hourlyRate * person.expectedHoursPerWeek * 52
    : person.annualSalary;

export const getPersonBonusPerYear = (person: PlannerPerson): number => {
  if (person.annualBonus <= 0) return 0;
  return person.bonusMode === 'salary-percent'
    ? (getPersonBaseAnnualIncome(person) * person.annualBonus) / 100
    : person.annualBonus;
};

/** CANONICAL person annual income: hourly-aware base (hours × 52; missing
 * hours = zero income) plus the full yearly bonus. The single reading —
 * there is no other total-income function. Undefined-tolerant. */
export const getPersonTotalIncome = (person: PlannerPerson | undefined): number => {
  if (!person) return 0;
  return getPersonBaseAnnualIncome(person) + getPersonBonusPerYear(person);
};

/** Hourly person with no expected hours entered: income is unknowable (not
 * zero) — the UI should prompt for hours instead of showing $0. */
export function isHourlyIncomeIncomplete(person: PlannerPerson): boolean {
  return person.payType === 'hourly' && person.expectedHoursPerWeek <= 0;
}

/** Sum of the given persons' salaries — contribution/match math only
 * (deliberately bonus-free: deferrals are a percentage of pay, not bonuses). */
export const getPersonsAnnualIncome = (personIds: string[], people: PlannerPerson[]): number => {
  if (personIds.length === 0) return people[0]?.annualSalary ?? 0;
  return personIds.reduce((sum, id) => {
    const p = people.find((p) => p.id === id);
    return sum + (p?.annualSalary ?? 0);
  }, 0);
};
