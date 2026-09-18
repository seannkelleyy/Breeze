import { describe, it, expect } from 'vitest';
import { getFinancialMathSnapshot } from '../plannerMath';
import { SINGLE_2025_TABLES } from './fixtures';

describe('getFinancialMathSnapshot', () => {
  const defaultInput = {
    monthlyExpenses: 4000,
    selfSalary: 120000,
    spouseSalary: 0,
    safeWithdrawalRate: 4,
    currentPortfolio: 500000,
    emergencyFundBalance: 20000,
    deductionType: 'STANDARD',
  };

  it('calculates annual spend correctly', () => {
    const snap = getFinancialMathSnapshot(defaultInput, SINGLE_2025_TABLES);
    expect(snap.annualSpend).toBe(48000);
  });

  it('calculates emergency fund tiers', () => {
    const snap = getFinancialMathSnapshot(defaultInput, SINGLE_2025_TABLES);
    expect(snap.emergencyFund3Months).toBe(12000);
    expect(snap.emergencyFund6Months).toBe(24000);
    expect(snap.emergencyFund12Months).toBe(48000);
  });

  it('calculates gross income', () => {
    const snap = getFinancialMathSnapshot(
      {
        ...defaultInput,
        selfSalary: 100000,
        spouseSalary: 80000,
      },
      SINGLE_2025_TABLES,
    );
    expect(snap.grossIncome).toBe(180000);
  });

  it('calculates net income using effective tax rate', () => {
    const snap = getFinancialMathSnapshot(defaultInput, SINGLE_2025_TABLES);
    // netIncomeFactor depends on tax calculation
    expect(snap.netIncomeFactor).toBeGreaterThan(0);
    expect(snap.netIncomeFactor).toBeLessThan(1);
    expect(snap.netIncome).toBeCloseTo(snap.grossIncome * snap.netIncomeFactor, 0);
  });

  it('uses the neutral factor while tax tables are loading', () => {
    const snap = getFinancialMathSnapshot(defaultInput, null);
    expect(snap.netIncomeFactor).toBe(0.8);
    expect(snap.netIncome).toBeCloseTo(snap.grossIncome * 0.8, 0);
  });

  it('calculates yearly savings', () => {
    const snap = getFinancialMathSnapshot(defaultInput, SINGLE_2025_TABLES);
    // yearlySavings = max(0, netIncome - annualSpend - annualExtraExpenseBuffer)
    expect(snap.yearlySavings).toBeGreaterThanOrEqual(0);
  });

  it('calculates withdrawal multiplier', () => {
    const snap = getFinancialMathSnapshot({ ...defaultInput, safeWithdrawalRate: 4 }, SINGLE_2025_TABLES);
    expect(snap.withdrawalMultiplier).toBeCloseTo(25, 2);
  });

  it('handles 0% SWR gracefully', () => {
    const snap = getFinancialMathSnapshot({ ...defaultInput, safeWithdrawalRate: 0 }, SINGLE_2025_TABLES);
    expect(snap.withdrawalMultiplier).toBe(25); // fallback
  });

  it('calculates yearly portfolio income', () => {
    const snap = getFinancialMathSnapshot(
      {
        ...defaultInput,
        currentPortfolio: 1000000,
        safeWithdrawalRate: 4,
      },
      SINGLE_2025_TABLES,
    );
    expect(snap.yearlyPortfolioIncome).toBeCloseTo(40000, 0);
  });

  it('handles missing fields gracefully', () => {
    const snap = getFinancialMathSnapshot({}, SINGLE_2025_TABLES);
    expect(snap.monthlyExpenses).toBe(0);
    expect(snap.selfSalary).toBe(0);
    expect(snap.grossIncome).toBe(0);
    expect(snap.annualSpend).toBe(0);
  });

  it('includes 10% extra expense buffer', () => {
    const snap = getFinancialMathSnapshot(defaultInput, SINGLE_2025_TABLES);
    expect(snap.annualExtraExpenseBuffer).toBeCloseTo(4800, 0); // 48000 * 0.10
  });
});
