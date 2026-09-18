import { describe, it, expect } from 'vitest';
import type { PlannerAccount, AccountType } from '../../../future/types/account';
import type { PlannerSummary } from '../../../future/types/planner';
import { computeFooStepCompletion } from '../fooCompletion';

const account = (
  accountType: AccountType,
  startingBalance: number,
  employerMatchRate = 0,
): PlannerAccount => ({
  id: `${accountType}-${startingBalance}`,
  name: accountType,
  personIds: [],
  accountType,
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance,
  annualRate: 0,
  returnProfile: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '',
  updatedAt: '',
});

const summary = (overrides: Partial<PlannerSummary> = {}): PlannerSummary => ({
  monthlyNeededForDesiredTarget: 0,
  requiredMonthlyTargetLabel: '',
  annualHouseholdIncome: 0,
  currentSavingsRateEmployeePercent: 0,
  currentSavingsRateTotalPercent: 0,
  requiredSavingsRatePercent: 0,
  savingsRateGapPercent: 0,
  weightedAnnualRate: 0,
  yearsToGoal: 0,
  monthlyGapToGoal: 0,
  isMonthlyGapPositive: false,
  totalStartingBalance: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  targetAge: 0,
  projectedNetWorthAtTargetAge: 0,
  totalPlannedMonthlyInvestment: 0,
  annualNeedAtRetirement: 0,
  financialFreedomTarget: 0,
  monthlyNeededForFreedomTarget: 0,
  ...overrides,
});

describe('computeFooStepCompletion', () => {
  it('returns an empty map when summary is null', () => {
    const result = computeFooStepCompletion([account('401k', 10000)], null);
    expect(result.size).toBe(0);
  });

  it('evaluates the clean-slate baseline correctly', () => {
    const result = computeFooStepCompletion([], summary());

    expect(result.get(1)).toBe(false); // deductible — never auto-detected
    expect(result.get(2)).toBe(false); // no employer match
    expect(result.get(3)).toBe(true); // no high-interest debt
    expect(result.get(4)).toBe(false); // no emergency fund
    expect(result.get(5)).toBe(false); // no Roth IRA
    expect(result.get(6)).toBe(false); // no employer plan
    expect(result.get(7)).toBe(false); // 0% savings rate
    expect(result.get(8)).toBe(false); // prepay — never auto-detected
    expect(result.get(9)).toBe(true); // no low-interest debt
  });

  describe('step 2 — employer match', () => {
    it('completes when a 401k has employer match configured', () => {
      const result = computeFooStepCompletion(
        [account('401k', 0, 50)],
        summary(),
      );
      expect(result.get(2)).toBe(true);
    });

    it('accepts 403b and 457 plans with match', () => {
      expect(
        computeFooStepCompletion([account('403b', 0, 50)], summary()).get(2),
      ).toBe(true);
      expect(computeFooStepCompletion([account('457', 0, 50)], summary()).get(2)).toBe(true);
    });

    it('does not complete for brokerage accounts with match configured', () => {
      expect(computeFooStepCompletion([account('brokerage', 0, 50)], summary()).get(2)).toBe(
        false,
      );
    });

    it('does not complete when employer match rate is zero', () => {
      expect(computeFooStepCompletion([account('401k', 50000, 0)], summary()).get(2)).toBe(false);
    });
  });

  describe('step 3 — high-interest debt', () => {
    it.each(['credit-card', 'personal-loan'] as const)(
      'does not complete with an outstanding %s balance',
      (type) => {
        expect(computeFooStepCompletion([account(type, 5000)], summary()).get(3)).toBe(false);
      },
    );

    it('completes when high-interest debt is fully paid off', () => {
      expect(computeFooStepCompletion([account('credit-card', 0)], summary()).get(3)).toBe(true);
    });

    it('ignores low-interest debt for this step', () => {
      expect(computeFooStepCompletion([account('mortgage', 300000)], summary()).get(3)).toBe(true);
    });
  });

  describe('step 4 — emergency fund', () => {
    it('completes with a funded emergency fund', () => {
      expect(computeFooStepCompletion([account('emergency-fund', 15000)], summary()).get(4)).toBe(
        true,
      );
    });

    it('does not complete with an empty emergency fund', () => {
      expect(computeFooStepCompletion([account('emergency-fund', 0)], summary()).get(4)).toBe(
        false,
      );
    });
  });

  describe('step 5 — Roth IRA and HSA', () => {
    it('completes with both a funded Roth IRA and funded HSA', () => {
      const result = computeFooStepCompletion(
        [account('roth-ira', 7000), account('hsa', 4400)],
        summary(),
      );
      expect(result.get(5)).toBe(true);
    });

    it('completes with a Roth IRA when no HSA account exists at all', () => {
      const result = computeFooStepCompletion([account('roth-ira', 7000)], summary());
      expect(result.get(5)).toBe(true);
    });

    it('does not complete when an HSA account exists but is unfunded', () => {
      const result = computeFooStepCompletion(
        [account('roth-ira', 7000), account('hsa', 0)],
        summary(),
      );
      expect(result.get(5)).toBe(false);
    });

    it('does not complete without a Roth IRA', () => {
      expect(computeFooStepCompletion([account('hsa', 4400)], summary()).get(5)).toBe(false);
    });
  });

  describe('step 6 — employer plan funded', () => {
    it.each(['401k', '403b', '457'] as const)('completes with a funded %s', (type) => {
      expect(computeFooStepCompletion([account(type, 50000)], summary()).get(6)).toBe(true);
    });

    it('does not complete with an unfunded employer plan', () => {
      expect(computeFooStepCompletion([account('401k', 0)], summary()).get(6)).toBe(false);
    });
  });

  describe('step 7 — hyperaccumulation savings rate', () => {
    it('completes at exactly 25% savings rate', () => {
      expect(
        computeFooStepCompletion([], summary({ currentSavingsRateTotalPercent: 25 })).get(7),
      ).toBe(true);
    });

    it('does not complete below 25%', () => {
      expect(
        computeFooStepCompletion([], summary({ currentSavingsRateTotalPercent: 24.9 })).get(7),
      ).toBe(false);
    });
  });

  describe('step 9 — low-interest debt', () => {
    it.each(['mortgage', 'student-loan'] as const)(
      'does not complete with an outstanding %s balance',
      (type) => {
        expect(computeFooStepCompletion([account(type, 5000)], summary()).get(9)).toBe(false);
      },
    );

    it('completes when low-interest debt is paid off', () => {
      expect(computeFooStepCompletion([account('student-loan', 0)], summary()).get(9)).toBe(true);
    });
  });
});
