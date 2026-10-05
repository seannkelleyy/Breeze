import { describe, it, expect } from 'vitest';
import {
  computeHouseholdWaterfall,
  computePersonWaterfall,
  getMonthPayrollIncomes,
  getPersonSavingsSplit,
} from '../paycheck';
import { additionalMedicareOwed } from '@/lib/calc/payrollTaxes';
import type { PaycheckWithholding } from '../paycheck';
import { PlannerPerson } from '../../types/person';
import { PlannerAccount } from '../../types/account';
import { SINGLE_2025_TABLES } from './fixtures';

const makePerson = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Test',
  birthday: '1990-01-01',
  retirementAge: 65,
  annualSalary: 120000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual',
  annualBonus: 0,
  incomeGrowthRate: 0,
  isPrimary: true,
  payType: 'salary',
  payDay: 1,
  payCadence: 'biweekly',
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

let accountSeq = 0;
const makeAccount = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: `a${++accountSeq}`,
  name: 'Account',
  accountType: '401k',
  personIds: ['p1'],
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 0,
  annualRate: 7,
  returnProfile: null,
  taxTreatment: 'PRE_TAX',
  pretaxSharePercent: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const makeWithholding = (overrides: Partial<PaycheckWithholding> = {}): PaycheckWithholding => ({
  id: `w${crypto.randomUUID()}`,
  personId: 'p1',
  name: 'Withholding',
  amount: 0,
  pretax: true,
  kind: 'INSURANCE',
  linkedAccountId: null,
  ...overrides,
});

const wf = (
  person: PlannerPerson,
  accounts: PlannerAccount[] = [],
  withholdings: PaycheckWithholding[] = [],
) => computePersonWaterfall(person, accounts, withholdings, SINGLE_2025_TABLES, 'STANDARD');

describe('computePersonWaterfall', () => {
  it('computes gross monthly from annual salary', () => {
    const result = wf(makePerson({ annualSalary: 120000 }));
    expect(result.grossMonthly).toBe(10000);
  });

  it('includes the full yearly bonus in gross, averaged monthly', () => {
    const person = makePerson({
      annualSalary: 120000,
      bonusMode: 'salary-percent',
      bonusFrequency: 'annual',
      annualBonus: 10,
    });
    const { grossMonthly } = wf(person, []);
    // (120,000 + 12,000) / 12 — one canonical gross everywhere.
    expect(grossMonthly).toBe(11000);
  });

  it('computes gross monthly from hourly pay', () => {
    const result = wf(makePerson({ payType: 'hourly', hourlyRate: 50, expectedHoursPerWeek: 40 }));
    // 50 * 40 * 52 / 12
    expect(result.grossMonthly).toBeCloseTo((50 * 40 * 52) / 12, 6);
  });

  it('with no deductions, take-home equals gross minus taxes', () => {
    const result = wf(makePerson());
    expect(result.savingsMonthly).toBe(0);
    expect(result.takeHomeMonthly).toBeCloseTo(result.grossMonthly - result.taxesMonthly, 6);
  });

  it('pre-tax 401(k) contributions reduce taxable income and take-home', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({
        contributionMode: 'monthly',
        contributionValue: 1000,
        taxTreatment: 'PRE_TAX',
      }),
    ];
    const withSavings = wf(person, accounts);
    const withoutSavings = wf(person);

    expect(withSavings.pretaxSavingsMonthly).toBe(1000);
    expect(withSavings.savingsMonthly).toBe(1000);
    expect(withSavings.taxableMonthly).toBe(9000);
    expect(withSavings.taxesMonthly).toBeLessThan(withoutSavings.taxesMonthly);
    expect(withSavings.takeHomeMonthly).toBeCloseTo(
      withSavings.grossMonthly - withSavings.taxesMonthly - 1000,
      6,
    );
  });

  it('splits a single 401(k) contribution by its pre-tax share', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({
        contributionMode: 'monthly',
        contributionValue: 1000,
        taxTreatment: 'PRE_TAX',
        pretaxSharePercent: 70,
      }),
    ];
    const withSplit = wf(person, accounts);
    const allPretax = wf(person, [
      makeAccount({
        contributionMode: 'monthly',
        contributionValue: 1000,
        taxTreatment: 'PRE_TAX',
      }),
    ]);

    expect(withSplit.pretaxSavingsMonthly).toBe(700);
    expect(withSplit.savingsMonthly).toBe(1000);
    // Only the pre-tax part lowers taxable income.
    expect(withSplit.taxableMonthly).toBe(9000 + 300);
    // Total take-home effect equals the same contribution fully pre-tax.
    expect(withSplit.takeHomeMonthly).toBeCloseTo(
      withSplit.grossMonthly - withSplit.taxesMonthly - 1000,
      6,
    );
    expect(allPretax.pretaxSavingsMonthly).toBe(1000);
  });

  it('Roth contributions reduce take-home but not taxable income', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({ contributionMode: 'monthly', contributionValue: 1000, taxTreatment: 'ROTH' }),
    ];
    const withRoth = wf(person, accounts);
    const without = wf(person);

    expect(withRoth.rothSavingsMonthly).toBe(1000);
    expect(withRoth.taxableMonthly).toBe(10000);
    expect(withRoth.taxesMonthly).toBeCloseTo(without.taxesMonthly, 6);
    expect(withRoth.takeHomeMonthly).toBeCloseTo(
      withRoth.grossMonthly - withRoth.taxesMonthly - 1000,
      6,
    );
  });

  it('excludes IRA accounts — they are not payroll-deducted', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({ accountType: 'roth-ira', contributionMode: 'monthly', contributionValue: 500 }),
      makeAccount({
        accountType: 'traditional-ira',
        contributionMode: 'monthly',
        contributionValue: 500,
      }),
    ];
    const result = wf(person, accounts);
    expect(result.savingsMonthly).toBe(0);
    expect(result.takeHomeMonthly).toBeCloseTo(result.grossMonthly - result.taxesMonthly, 6);
  });

  it('excludes employer match from the paycheck waterfall', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({
        contributionMode: 'monthly',
        contributionValue: 1000,
        employerMatchRate: 50,
        employerMatchMaxPercentOfSalary: 6,
      }),
    ];
    const result = wf(person, accounts);
    expect(result.savingsMonthly).toBe(1000);
  });

  it('counts savings accounts only for their owners', () => {
    const person = makePerson({ id: 'p1' });
    const other = makePerson({ id: 'p2' });
    const accounts = [
      makeAccount({ personIds: ['p2'], contributionMode: 'monthly', contributionValue: 1000 }),
    ];
    const result = wf(person, accounts);
    const otherResult = wf(other, accounts);
    expect(result.savingsMonthly).toBe(0);
    expect(otherResult.savingsMonthly).toBe(1000);
  });

  it('pre-tax withholdings reduce taxable income; post-tax do not', () => {
    const person = makePerson();
    const withholdings = [
      makeWithholding({ amount: 200, pretax: true }),
      makeWithholding({ amount: 100, pretax: false }),
    ];
    const result = wf(person, [], withholdings);
    expect(result.pretaxWithholdingsMonthly).toBe(200);
    expect(result.posttaxWithholdingsMonthly).toBe(100);
    expect(result.taxableMonthly).toBe(9800);
    expect(result.takeHomeMonthly).toBeCloseTo(result.grossMonthly - result.taxesMonthly - 100, 6);
  });

  it('ignores withholdings that belong to other people', () => {
    const person = makePerson();
    const withholdings = [makeWithholding({ personId: 'p2', amount: 300 })];
    const result = wf(person, [], withholdings);
    expect(result.pretaxWithholdingsMonthly).toBe(0);
    expect(result.posttaxWithholdingsMonthly).toBe(0);
  });

  it('floors taxable income at zero when pre-tax deductions exceed gross', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({
        contributionMode: 'monthly',
        contributionValue: 9000,
        taxTreatment: 'PRE_TAX',
      }),
    ];
    const withholdings = [makeWithholding({ amount: 5000, pretax: true })];
    const result = wf(person, accounts, withholdings);
    expect(result.taxableMonthly).toBe(0);
    // FICA never had a deduction to begin with (the 401(k) is FICA-taxable),
    // but the §125 pretax withholding still reduced FICA wages: 10,000 −
    // 5,000 = 5,000 × 7.65% = 382.50. Zero income tax, real FICA.
    expect(result.taxesMonthly).toBeCloseTo(382.5, 2);
  });

  it('supports salary-percent savings contributions', () => {
    const person = makePerson();
    const accounts = [makeAccount({ contributionMode: 'salary-percent', contributionValue: 10 })];
    const result = wf(person, accounts);
    expect(result.savingsMonthly).toBeCloseTo(1000, 6);
  });
});

describe('getPersonSavingsSplit', () => {
  it('splits mixed pre-tax and Roth savings by tax treatment', () => {
    const person = makePerson();
    const accounts = [
      makeAccount({ contributionMode: 'monthly', contributionValue: 800, taxTreatment: 'PRE_TAX' }),
      makeAccount({
        accountType: 'hsa',
        contributionMode: 'monthly',
        contributionValue: 200,
        taxTreatment: 'ROTH',
      }),
    ];
    const split = getPersonSavingsSplit(person, accounts);
    expect(split.pretaxMonthly).toBe(800);
    expect(split.rothMonthly).toBe(200);
  });
});

describe('getMonthPayrollIncomes', () => {
  it('creates one row per payday with the net per-check amount', () => {
    const person = makePerson({ name: 'Sean', payCadence: 'biweekly', payDay: 1 });
    const accounts = [
      makeAccount({
        contributionMode: 'monthly',
        contributionValue: 1000,
        taxTreatment: 'PRE_TAX',
      }),
    ];
    const rows = getMonthPayrollIncomes(
      [person],
      accounts,
      [],
      SINGLE_2025_TABLES,
      'STANDARD',
      2026,
      7,
    );

    // July 2026 biweekly Mondays: 6 and 20
    expect(rows.map((r) => r.date)).toEqual(['2026-07-06', '2026-07-20']);
    const waterfall = computePersonWaterfall(person, accounts, [], SINGLE_2025_TABLES, 'STANDARD');
    const expectedNet = waterfall.takeHomeAnnual / 26;
    for (const row of rows) {
      expect(row.personId).toBe(person.id);
      expect(row.name).toContain('Sean');
      expect(row.amount).toBeCloseTo(expectedNet, 2);
    }
  });

  it('returns no rows when there are no people', () => {
    expect(getMonthPayrollIncomes([], [], [], SINGLE_2025_TABLES, 'STANDARD', 2026, 7)).toEqual([]);
  });
});

describe('computeHouseholdWaterfall', () => {
  it('sums per-person waterfalls and recomputes the effective rate', () => {
    const p1 = makePerson({ id: 'p1', annualSalary: 120000 });
    const p2 = makePerson({ id: 'p2', annualSalary: 60000 });
    const accounts = [
      makeAccount({ personIds: ['p1'], contributionMode: 'monthly', contributionValue: 1000 }),
    ];
    const withholdings = [makeWithholding({ personId: 'p2', amount: 200, pretax: true })];

    const total = computeHouseholdWaterfall(
      [p1, p2],
      accounts,
      withholdings,
      SINGLE_2025_TABLES,
      'STANDARD',
    );
    expect(total.grossMonthly).toBeCloseTo(15000, 6);
    expect(total.savingsMonthly).toBe(1000);
    expect(total.pretaxWithholdingsMonthly).toBe(200);
    expect(total.takeHomeMonthly).toBeGreaterThan(0);
    expect(total.effectiveRate).toBeCloseTo(total.taxesMonthly / total.grossMonthly, 6);
  });
});

describe('Additional Medicare — withheld vs owed', () => {
  it('dual-$150k MFJ household: nothing withheld, $450 owed on the return', () => {
    // Neither spouse crosses the $200k withholding threshold, so paychecks
    // mirror reality — no extra withholding. The RETURN still owes 0.9% on
    // combined FICA wages over the $250k MFJ threshold: (300k − 250k) × 0.9%.
    const sean = makePerson({ id: 'sean', annualSalary: 150000, annualBonus: 0 });
    const aalissia = makePerson({ id: 'aalissia', annualSalary: 150000, annualBonus: 0 });
    const household = computeHouseholdWaterfall(
      [sean, aalissia],
      [],
      [],
      SINGLE_2025_TABLES,
      'STANDARD',
      'MFJ',
    );

    expect(household.additionalMedicareWithheldAnnual).toBe(0);
    expect(household.additionalMedicareOwedAnnual).toBeCloseTo(450, 6);
    // Invariant: take-home = gross − taxes, and household taxes include the
    // $450 additional Medicare owed (withheld was zero).
    expect(household.takeHomeAnnual).toBeCloseTo(
      household.grossMonthly * 12 - household.taxesMonthly * 12,
      2,
    );
    // Behavioral check: the same household taxed with the SINGLE threshold
    // ($200k) takes home exactly $450 less — the wider MFJ threshold is
    // worth that much in additional-Medicare relief.
    const asSingle = computeHouseholdWaterfall(
      [sean, aalissia],
      [],
      [],
      SINGLE_2025_TABLES,
      'STANDARD',
      'SINGLE',
    );
    expect(asSingle.takeHomeAnnual).toBeCloseTo(household.takeHomeAnnual - 450, 2);
  });

  it('single $250k wage: withheld equals owed for SINGLE filers', () => {
    const person = makePerson({ annualSalary: 250000, annualBonus: 0 });
    const wf = computePersonWaterfall(person, [], [], SINGLE_2025_TABLES, 'STANDARD');
    const owed = additionalMedicareOwed(wf.ficaWagesAnnual, 'SINGLE');
    // (250k − 200k) × 0.9% — what the employer withheld matches the return.
    expect(wf.additionalMedicareWithheldAnnual).toBeCloseTo(owed, 6);
  });
});
