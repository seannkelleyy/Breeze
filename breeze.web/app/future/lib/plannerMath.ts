/**
 * Contribution math, household income helpers, and IRS limit resolution.
 * Tax math lives in ./tax, the projection engine in ./projection,
 * rate conversions in ./rates.
 */
import type { ChartConfig } from '@/components/ui/chart';
import type { AccountType, PlannerAccount } from '../types/account';
import type { IrsLimitConfig, IrsLimitKey } from '../types/irs';
import type { PayCadence, PlannerPerson } from '../types/person';
import * as plannerConfig from './config';
import * as plannerConstants from './constants';

const { isNonContributingAccountType } = plannerConfig;

export const plannerChartConfig = {
  totalBalance: { label: 'All Assets', color: 'var(--chart-1))' },
  investable: { label: 'Investable', color: 'var(--chart-2)' },
  property: { label: 'Property', color: 'var(--chart-4)' },
} satisfies ChartConfig;
export const accountLineColors = [
  'var(--chart-2))',
  'var(--chart-3))',
  'var(--chart-4))',
  'var(--chart-5))',
  'var(--chart-1))',
];
export const clamp = (v: number, m = 0): number => (Number.isFinite(v) ? Math.max(m, v) : m);
export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const getTotalMonthlyForAccount = (a: PlannerAccount, people: PlannerPerson[]): number =>
  getEmployeeMonthlyContribution(a, people) + getEmployerMatchMonthly(a, people);
export const getPersonsAnnualIncome = (personIds: string[], people: PlannerPerson[]): number => {
  if (personIds.length === 0) return people[0]?.annualSalary ?? 0;
  return personIds.reduce((sum, id) => {
    const p = people.find((p) => p.id === id);
    return sum + (p?.annualSalary ?? 0);
  }, 0);
};
export const getTotalAnnualIncome = (p: PlannerPerson | undefined): number =>
  p ? p.annualSalary + (p.bonusMode === 'dollars' ? p.annualBonus : 0) : 0;
export const getPlannerContributionTotals = (
  accounts: PlannerAccount[],
  people: PlannerPerson[],
) => {
  let te = 0,
    tm = 0,
    ti = 0;
  for (const a of accounts) {
    const e = getEmployeeMonthlyContribution(a, people);
    const m = getEmployerMatchMonthly(a, people);
    te += e;
    tm += m;
    ti += e + m;
  }
  return {
    totalPlannedMonthlyEmployee: te,
    totalPlannedMonthlyMatch: tm,
    totalPlannedMonthlyInvestment: ti,
  };
};
export const getPlannerHouseholdSnapshot = (people: PlannerPerson[]) => {
  const bd = people[0]?.birthday ?? '';
  const hi = people.reduce((sum, p) => sum + getTotalAnnualIncome(p), 0);
  const ca = getAgeFromBirthday(bd);
  return {
    people,
    householdIncome: hi,
    currentAge: ca,
    annualHouseholdIncome: hi,
  };
};
export const defaultIrsLimits: IrsLimitConfig = plannerConstants.PLANNER_DEFAULT_IRS_LIMITS;
export const getAgeFromBirthday = (birthday: string): number => {
  if (!birthday) return 30;
  const b = new Date(birthday);
  if (isNaN(b.getTime())) return 30;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return Math.max(a, 0);
};
export const getSuggestedAnnualLimit = (
  t: AccountType,
  age: number,
  limits: IrsLimitConfig,
  inclSpouse: boolean,
): number => {
  const key = getIrsLimitKeyFromApiType(t);
  if (!key) return 0;
  const rule = limits[key];
  if (!rule) return 0;
  let limit = rule.baseAnnualLimit;
  // Ages 60–63 get the enhanced "super catch-up", which replaces the regular
  // catch-up rather than adding to it (IRS SECURE 2.0 rule for 401k-style plans).
  if (rule.superCatchUpAmount && age >= 60 && age <= 63) {
    limit += rule.superCatchUpAmount;
  } else if (age >= rule.catchUpAge) {
    limit += rule.catchUpAmount;
  }
  return inclSpouse && rule.familyAnnualLimit ? rule.familyAnnualLimit : limit;
};
/** IRS limit groups: account types whose contributions share one limit. */
export type IrsLimitGroup = 'deferral' | '457' | 'ira' | 'hsa';

export const getIrsLimitGroup = (type: string): IrsLimitGroup | null => {
  if (type === '401k' || type === '403b') return 'deferral';
  if (type === '457') return '457';
  if (type === 'roth-ira' || type === 'traditional-ira') return 'ira';
  if (type === 'hsa') return 'hsa';
  return null;
};

/**
 * A person's total annual employee contributions across every account in the
 * same IRS limit group (e.g. all their 401(k)+403(b) accounts together).
 */
export const getPersonGroupAnnualContribution = (
  personId: string,
  group: IrsLimitGroup,
  accounts: PlannerAccount[],
  people: PlannerPerson[],
): number => {
  const groupTypes: Record<IrsLimitGroup, Set<string>> = {
    deferral: new Set(['401k', '403b']),
    '457': new Set(['457']),
    ira: new Set(['roth-ira', 'traditional-ira']),
    hsa: new Set(['hsa']),
  };
  return accounts
    .filter((a) => groupTypes[group].has(a.accountType) && a.personIds.includes(personId))
    .reduce((sum, a) => sum + getEmployeeMonthlyContribution(a, people) * 12, 0);
};

export const getIrsLimitKeyFromApiType = (type: string): IrsLimitKey | null => {
  // 401k + 403b share the IRS elective-deferral limit; 457(b) has its own.
  if (type === '401k' || type === '403b') return '401k';
  if (type === '457') return '457';
  if (type === 'roth-ira') return 'roth-ira';
  if (type === 'traditional-ira') return 'traditional-ira';
  if (type === 'hsa') return 'hsa';
  return null;
};
export const getEmployerMatchMonthlyFromAnnual = (
  account: PlannerAccount,
  ownerAnnualIncome: number,
  employeeAnnualContribution: number,
): number => {
  if (account.accountType !== '401k') return 0;
  const normalizedSalary = clamp(ownerAnnualIncome);
  if (normalizedSalary <= 0) return 0;
  const matchable = normalizedSalary * (clamp(account.employerMatchMaxPercentOfSalary) / 100);
  const eligible = Math.min(clamp(employeeAnnualContribution), matchable);
  const annualMatch = eligible * (clamp(account.employerMatchRate) / 100);
  return annualMatch / 12;
};

export const getMonthlyContribution = (
  target: number,
  start: number,
  rate: number,
  years?: number,
): number => {
  if (target <= 0) return 0;
  if (!years || years <= 0) return Math.max(0, target - start);
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  if (Math.abs(monthlyRate) < 1e-10) return Math.max(0, (target - start) / months);
  const compoundFactor = (1 + monthlyRate) ** months;
  if (Math.abs(compoundFactor - 1) < 1e-10) return Math.max(0, (target - start) / months);
  return Math.max(0, ((target - start * compoundFactor) * monthlyRate) / (compoundFactor - 1));
};
export const getYearsUntilGoalEstimate = (
  target: number,
  cur: number,
  contrib: number,
  rate: number,
): number => {
  if (target <= 0) return 0;
  if (contrib <= 0) return 999;
  const monthlyRate = rate / 100 / 12;
  const monthlyContrib = contrib;
  if (Math.abs(monthlyRate) < 1e-10) return Math.ceil((target - cur) / (monthlyContrib * 12));
  const denominator = monthlyContrib + monthlyRate * cur;
  if (Math.abs(denominator) < 1e-10) return 999;
  const numerator = monthlyContrib + monthlyRate * target;
  if (Math.abs(numerator) < 1e-10) return 999;
  const n = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return Math.max(0, Math.ceil(n / 12));
};
export const getAnnualIncomeWithGrowth = (b: number, g: number, y: number): number =>
  b * (1 + g / 100) ** y;
export const getEmployeeMonthlyContribution = (
  a: PlannerAccount,
  people: PlannerPerson[],
): number => {
  if (isNonContributingAccountType(a.accountType)) return 0;
  const inc = getPersonsAnnualIncome(a.personIds, people);
  if (a.contributionMode === 'salary-percent')
    return clamp((inc * (a.contributionValue / 100)) / 12);
  if (a.contributionMode === 'yearly') return clamp(a.contributionValue / 12);
  if (a.contributionMode === 'biweekly') return clamp((a.contributionValue * 26) / 12);
  if (a.contributionMode === 'weekly') return clamp((a.contributionValue * 52) / 12);
  return clamp(a.contributionValue);
};
export const getEmployerMatchMonthly = (a: PlannerAccount, people: PlannerPerson[]): number => {
  const inc = getPersonsAnnualIncome(a.personIds, people);
  const emp = getEmployeeMonthlyContribution(a, people);
  if (a.employerMatchRate <= 0) return 0;
  const cap = inc * (a.employerMatchMaxPercentOfSalary / 100);
  const eff = Math.min(emp * 12, cap);
  return clamp((eff * a.employerMatchRate) / 100 / 12);
};

// ── Pay & payday math ─────────────────────────────────────

export const getPaychecksPerYear = (cadence: PayCadence): number => {
  switch (cadence) {
    case 'weekly':
      return 52;
    case 'biweekly':
      return 26;
    case 'semimonthly':
      return 24;
    case 'monthly':
      return 12;
  }
};

export const getPersonBaseAnnualIncome = (person: PlannerPerson): number =>
  person.payType === 'hourly'
    ? person.hourlyRate * person.expectedHoursPerWeek * 52
    : person.annualSalary;

export const getPersonBonusPerYear = (person: PlannerPerson): number => {
  if (person.annualBonus <= 0) return 0;
  const perYear =
    person.bonusFrequency === 'quarterly' ? 4 : person.bonusFrequency === 'monthly' ? 12 : 1;
  return person.bonusMode === 'salary-percent'
    ? (getPersonBaseAnnualIncome(person) * person.annualBonus * perYear) / 100
    : person.annualBonus;
};

export const getPersonTotalIncome = (person: PlannerPerson): number =>
  getPersonBaseAnnualIncome(person) + getPersonBonusPerYear(person);

export const getPersonPaycheckAmount = (person: PlannerPerson): number =>
  getPersonBaseAnnualIncome(person) / getPaychecksPerYear(person.payCadence);

// Weekday helpers: stored payDay uses 1 = Monday … 7 = Sunday.
const mondayBasedWeekday = (date: Date): number => ((date.getDay() + 6) % 7) + 1;

/**
 * Paydays for a person within a calendar month (month is 0-based).
 * - weekly: every matching weekday
 * - biweekly: every 14 days anchored to the first matching weekday of the year,
 *   so the schedule stays continuous across months
 * - semimonthly: payDay and payDay + 15 (clamped to month length)
 * - monthly: payDay (clamped to month length)
 */
export const getPersonPaydaysForMonth = (
  person: PlannerPerson,
  year: number,
  month: number,
): Date[] => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const clampToMonth = (day: number) => Math.min(Math.max(1, day), lastDay);

  if (person.payCadence === 'semimonthly') {
    const first = clampToMonth(person.payDay);
    return [new Date(year, month, first), new Date(year, month, clampToMonth(first + 15))];
  }
  if (person.payCadence === 'monthly') {
    return [new Date(year, month, clampToMonth(person.payDay))];
  }

  // weekly / biweekly — keyed off the stored weekday (1-7)
  if (person.payDay < 1 || person.payDay > 7) return [];
  const dates: Date[] = [];
  if (person.payCadence === 'weekly') {
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      if (mondayBasedWeekday(date) === person.payDay) dates.push(date);
    }
    return dates;
  }
  // biweekly: anchor to the first matching weekday of the year, step 14 days
  let date = new Date(year, 0, 1);
  while (mondayBasedWeekday(date) !== person.payDay) {
    date = new Date(year, 0, date.getDate() + 1);
  }
  const monthEnd = new Date(year, month + 1, 0);
  while (date <= monthEnd) {
    if (date.getMonth() === month) dates.push(new Date(date));
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 14);
  }
  return dates;
};
