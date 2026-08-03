import { describe, it, expect } from 'vitest';
import { getNetWorthStartingBalance, getAssetFinanceSnapshot } from '../plannerMath';
import type { PlannerAccount } from '../../types/account';
import type { AssetFinanceDetails } from '../../types/finance';

const makeAccount = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'test-id',
  name: 'Test Account',
  personIds: [],
  accountType: 'checking',
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 10000,
  annualRate: 5,
  returnProfile: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  ...overrides,
});

describe('getNetWorthStartingBalance', () => {
  it('returns positive balance for asset accounts', () => {
    const account = makeAccount({ startingBalance: 50000 });
    expect(getNetWorthStartingBalance(account)).toBe(50000);
  });

  it('returns negative balance for liability accounts', () => {
    const account = makeAccount({
      accountType: 'student-loan',
      startingBalance: 30000,
    });
    expect(getNetWorthStartingBalance(account)).toBe(-30000);
  });

  it('returns 0 for home accounts', () => {
    const account = makeAccount({
      accountType: 'home',
      startingBalance: 400000,
    });
    expect(getNetWorthStartingBalance(account)).toBe(0);
  });

  it('returns 0 for vehicle accounts', () => {
    const account = makeAccount({
      accountType: 'vehicle',
      startingBalance: 25000,
    });
    expect(getNetWorthStartingBalance(account)).toBe(0);
  });

  it('clamps negative asset balances to 0', () => {
    const account = makeAccount({ startingBalance: -5000 });
    expect(getNetWorthStartingBalance(account)).toBe(0);
  });

  it('clamps negative liability balances to 0 (prevents positive)', () => {
    const account = makeAccount({
      accountType: 'credit-card',
      startingBalance: -1000,
    });
    expect(getNetWorthStartingBalance(account)).toBe(-0);
  });

  it('handles mortgage as liability', () => {
    const account = makeAccount({
      accountType: 'mortgage',
      startingBalance: 350000,
    });
    expect(getNetWorthStartingBalance(account)).toBe(-350000);
  });

  it('handles auto-loan as liability', () => {
    const account = makeAccount({
      accountType: 'auto-loan',
      startingBalance: 15000,
    });
    expect(getNetWorthStartingBalance(account)).toBe(-15000);
  });
});

describe('getAssetFinanceSnapshot', () => {
  const makeDetails = (overrides: Partial<AssetFinanceDetails> = {}): AssetFinanceDetails => ({
    purchaseDate: '2020-01-01',
    purchasePrice: 400000,
    currentValue: 450000,
    annualChangeRate: 4,
    homeGrowthProfile: 'medium',
    vehicleDepreciationProfile: 'medium',
    hasLoan: false,
    loanInterestRate: 6,
    originalLoanAmount: 0,
    loanMonthlyPayment: 0,
    loanTermYears: 30,
    loanStartDate: '2020-01-01',
    currentLoanBalance: 0,
    ...overrides,
  });

  it('returns full equity when no loan', () => {
    const details = makeDetails({ hasLoan: false, currentValue: 450000 });
    const snapshot = getAssetFinanceSnapshot(details, new Date('2025-06-01'));
    expect(snapshot.assetValue).toBe(450000);
    expect(snapshot.loanBalance).toBe(0);
    expect(snapshot.equity).toBe(450000);
    expect(snapshot.remainingLoanMonths).toBe(0);
  });

  it('calculates equity with loan', () => {
    const details = makeDetails({
      hasLoan: true,
      currentValue: 450000,
      currentLoanBalance: 300000,
    });
    const snapshot = getAssetFinanceSnapshot(details, new Date('2025-06-01'));
    expect(snapshot.assetValue).toBe(450000);
    expect(snapshot.loanBalance).toBe(300000);
    expect(snapshot.equity).toBe(150000);
  });

  it('calculates remaining loan months', () => {
    const details = makeDetails({
      hasLoan: true,
      loanStartDate: '2020-01-01',
      loanTermYears: 30,
    });
    const snapshot = getAssetFinanceSnapshot(details, new Date('2025-06-01'));
    // ~5.4 years elapsed, ~24.6 years remaining = ~295 months
    expect(snapshot.remainingLoanMonths).toBeGreaterThan(290);
    expect(snapshot.remainingLoanMonths).toBeLessThan(300);
  });

  it('clamps remaining months to 0 when loan is paid off', () => {
    const details = makeDetails({
      hasLoan: true,
      loanStartDate: '2000-01-01',
      loanTermYears: 15,
    });
    const snapshot = getAssetFinanceSnapshot(details, new Date('2025-06-01'));
    expect(snapshot.remainingLoanMonths).toBe(0);
  });

  it('clamps asset value to 0 minimum', () => {
    const details = makeDetails({ currentValue: -5000 });
    const snapshot = getAssetFinanceSnapshot(details, new Date('2025-06-01'));
    expect(snapshot.assetValue).toBe(0);
  });

  it('calculates months since purchase', () => {
    const details = makeDetails({ purchaseDate: '2023-06-15' });
    const snapshot = getAssetFinanceSnapshot(details, new Date('2025-06-15'));
    expect(snapshot.monthsSincePurchase).toBe(24);
  });
});
