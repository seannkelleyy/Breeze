import { describe, expect, it } from 'vitest';
import {
  buildRetirementIncomePlan,
  type RetirementIncomePlanInput,
} from '../retirementIncome';
import type { AccountType, PlannerAccount } from '../../types/account';

let nextId = 0;

const makeAccount = (
  accountType: AccountType,
  startingBalance: number,
  annualRate = 0,
): PlannerAccount => ({
  id: `acct-${nextId++}`,
  name: accountType,
  personIds: ['p1'],
  accountType,
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance,
  annualRate,
  returnProfile: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const makeInput = (
  overrides: Partial<RetirementIncomePlanInput> = {},
): RetirementIncomePlanInput => ({
  accounts: [],
  currentAge: 50,
  retirementAge: 55,
  endAge: 60,
  annualExpenses: 0,
  inflationRatePercent: 0,
  useInflationAdjustedValues: true,
  marketAdjustmentPercent: 0,
  currentYear: 2026,
  hsaReceiptBalance: 0,
  conversionBuckets: [],
  ...overrides,
});

describe('buildRetirementIncomePlan', () => {
  it('returns an empty plan when retirement age is at or past the end age', () => {
    const plan = buildRetirementIncomePlan(makeInput({ retirementAge: 60, endAge: 60 }));
    expect(plan.rows).toHaveLength(0);
    expect(plan.endingPortfolioBalance).toBe(0);
  });

  it('spends HSA receipts first, capped by the HSA account balance', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [
          makeAccount('hsa', 200),
          makeAccount('brokerage', 100000),
        ],
        annualExpenses: 400,
        hsaReceiptBalance: 500,
      }),
    );

    expect(plan.rows).toHaveLength(5);
    const first = plan.rows[0];
    // Receipt balance is 500 but the account only holds 200.
    expect(first.hsaReceipts).toBeCloseTo(200, 8);
    expect(first.taxable).toBeCloseTo(200, 8);
    expect(first.receiptBalance).toBeCloseTo(300, 8);
    expect(first.hsaBalance).toBeCloseTo(0, 8);
    expect(first.penaltyExposure).toBe(0);
  });

  it('draws sources in order: hsa receipts, taxable, pretax, then roth', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [
          makeAccount('hsa', 1000),
          makeAccount('brokerage', 4000),
          makeAccount('traditional-ira', 4000),
          makeAccount('roth-ira', 4000),
        ],
        annualExpenses: 5000,
        hsaReceiptBalance: 1000,
      }),
    );

    const first = plan.rows[0];
    expect(first.hsaReceipts).toBeCloseTo(1000, 8);
    expect(first.taxable).toBeCloseTo(4000, 8);
    expect(first.pretax).toBeCloseTo(0, 8);
    // Retiring at 55 is before 59½: pre-tax and unclocked Roth draw penalties.
    // Expenses are 5000 and only 5000 was covered, so nothing drew from pretax
    // or Roth this year.
    expect(first.shortfall).toBeCloseTo(0, 8);

    // By the second retirement year the HSA and taxable pools are spent;
    // pretax picks up the rest and the Roth overflow is penalized too (both
    // draws happen before 59½).
    const second = plan.rows[1];
    expect(second.hsaReceipts).toBe(0);
    expect(second.taxable).toBeCloseTo(0, 8);
    expect(second.pretax).toBeGreaterThan(0);
    expect(second.penaltyExposure).toBeCloseTo((second.pretax + second.rothOther) * 0.1, 8);
  });

  it('stops flagging penalties once the primary passes 59½', () => {
    // Current age 50, retire at 58: the first row is age 59 (penalized), then
    // age 60+ draws free.
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [makeAccount('traditional-ira', 100000)],
        currentAge: 50,
        retirementAge: 58,
        endAge: 62,
        annualExpenses: 10000,
      }),
    );

    const age59 = plan.rows.find((r) => r.age === 59);
    const age60 = plan.rows.find((r) => r.age === 60);
    expect(age59?.penaltyExposure).toBeCloseTo((age59?.pretax ?? 0) * 0.1, 8);
    expect(age60?.pretax).toBeGreaterThan(0);
    expect(age60?.penaltyExposure).toBe(0);
  });

  it('uses clocked conversions before the unclocked Roth and only after their year', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [makeAccount('roth-ira', 20000)],
        currentAge: 65,
        retirementAge: 65,
        endAge: 69,
        annualExpenses: 2000,
        currentYear: 2026,
        conversionBuckets: [{ availableOn: '2030-01-01', amount: 3000 }],
      }),
    );

    // Ages 66-69 map to 2027-2030. Only 2030 clears the bucket's clock.
    const before = plan.rows.filter((r) => r.year < 2030);
    const unlock = plan.rows.find((r) => r.year === 2030);
    for (const row of before) {
      expect(row.rothClocked).toBe(0);
      expect(row.rothOther).toBeCloseTo(row.expense, 8);
    }
    expect(unlock?.rothClocked).toBeCloseTo(2000, 8);
    expect(unlock?.rothOther).toBeCloseTo(0, 8);
  });

  it('never draws more clocked conversions than exist', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [makeAccount('roth-ira', 100000)],
        currentAge: 65,
        retirementAge: 65,
        endAge: 69,
        annualExpenses: 2000,
        currentYear: 2026,
        conversionBuckets: [{ availableOn: '2020-01-01', amount: 3000 }],
      }),
    );

    const totalClocked = plan.rows.reduce((sum, r) => sum + r.rothClocked, 0);
    const totalOther = plan.rows.reduce((sum, r) => sum + r.rothOther, 0);
    expect(totalClocked).toBeCloseTo(3000, 6);
    // Years 2027+ are past 59½ anyway; the rest flows from the unclocked pool
    // without penalty exposure.
    expect(totalOther).toBeGreaterThan(0);
    expect(plan.totalPenaltyExposure).toBe(0);
  });

  it('records a shortfall when no source can cover spending', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [makeAccount('brokerage', 1000)],
        annualExpenses: 5000,
      }),
    );

    expect(plan.rows[0].taxable).toBeCloseTo(1000, 6);
    expect(plan.rows[0].shortfall).toBeGreaterThan(0);
    expect(plan.firstShortfallAge).toBe(56);
    expect(plan.totalShortfall).toBeGreaterThan(0);
  });

  it('inflates expenses in nominal mode and keeps them flat in real mode', () => {
    const base = {
      accounts: [makeAccount('brokerage', 1000000)],
      annualExpenses: 10000,
      inflationRatePercent: 10,
    };

    const nominal = buildRetirementIncomePlan(makeInput({ ...base, useInflationAdjustedValues: false }));
    const real = buildRetirementIncomePlan(makeInput({ ...base, useInflationAdjustedValues: true }));

    // Retirement starts six years out (age 56): five years of inflation have
    // accrued by the first withdrawal, six by the second.
    expect(nominal.rows[0].expense).toBeCloseTo(10000 * 1.1 ** 5, 6);
    expect(nominal.rows[1].expense).toBeCloseTo(10000 * 1.1 ** 6, 6);
    expect(real.rows[0].expense).toBeCloseTo(10000, 6);
    expect(real.rows[1].expense).toBeCloseTo(10000, 6);
  });

  it('grows balances before spending in growth years', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [makeAccount('brokerage', 10000, 100)],
        currentAge: 50,
        retirementAge: 51,
        endAge: 52,
        annualExpenses: 1000,
      }),
    );

    // Two years at 100% growth (ages 51 and 52) quadruple the pool before the
    // first retirement year's withdrawal — withdrawals begin the year after
    // the retirement age.
    const first = plan.rows[0];
    expect(first.age).toBe(52);
    expect(first.taxableBalance).toBeCloseTo(39000, 4);
  });

  it('ignores property, liabilities, and linked accounts as spending sources', () => {
    const plan = buildRetirementIncomePlan(
      makeInput({
        accounts: [
          makeAccount('home', 500000),
          makeAccount('vehicle', 30000),
          makeAccount('mortgage', 200000),
          makeAccount('checking', 5000),
        ],
        annualExpenses: 1000,
      }),
    );

    expect(plan.rows[0].taxable).toBeCloseTo(1000, 6);
    // Four retirement years drain the 5000 checking account (growth-free) to
    // nothing by the end of the plan.
    expect(plan.endingPortfolioBalance).toBeCloseTo(0, 6);
  });
});
