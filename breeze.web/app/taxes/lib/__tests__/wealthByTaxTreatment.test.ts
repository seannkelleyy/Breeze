import { describe, it, expect } from 'vitest';
import { getWealthByTaxTreatment } from '../wealthByTaxTreatment';
import type { PlannerAccount } from '../../../future/types/account';

const account = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'a1',
  name: 'Test',
  personIds: ['p1'],
  accountType: 'brokerage',
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 0,
  annualRate: 7,
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
  taxTreatment: 'PRE_TAX',
  pretaxSharePercent: null,
  ...overrides,
});

const bucketOf = (result: ReturnType<typeof getWealthByTaxTreatment>, key: 'pretax' | 'roth' | 'taxable') =>
  result.buckets.find((b) => b.key === key)!;

describe('getWealthByTaxTreatment', () => {
  it('splits a 70/30 account into both buckets proportionally', () => {
    const result = getWealthByTaxTreatment([
      account({ accountType: '401k', startingBalance: 100000, pretaxSharePercent: 70 }),
    ]);
    expect(bucketOf(result, 'pretax').balance).toBeCloseTo(70000, 6);
    expect(bucketOf(result, 'roth').balance).toBeCloseTo(30000, 6);
    expect(result.totalInvestment).toBeCloseTo(100000, 6);
  });

  it('puts Roth and Traditional IRAs in opposite buckets via fixed treatment', () => {
    const result = getWealthByTaxTreatment([
      account({ accountType: 'roth-ira', startingBalance: 50000, taxTreatment: 'ROTH' }),
      account({ accountType: 'traditional-ira', startingBalance: 20000, taxTreatment: 'PRE_TAX' }),
    ]);
    expect(bucketOf(result, 'roth').balance).toBe(50000);
    expect(bucketOf(result, 'pretax').balance).toBe(20000);
  });

  it('routes brokerage and cash to taxable', () => {
    const result = getWealthByTaxTreatment([
      account({ accountType: 'brokerage', startingBalance: 25000 }),
      account({ accountType: 'emergency-fund', startingBalance: 15000 }),
    ]);
    expect(bucketOf(result, 'taxable').balance).toBe(40000);
  });

  it('excludes property and liabilities from the buckets', () => {
    const result = getWealthByTaxTreatment([
      account({ accountType: 'home', startingBalance: 350000 }),
      account({ accountType: 'mortgage', startingBalance: 114000 }),
      account({ accountType: '401k', startingBalance: 100000, pretaxSharePercent: 100 }),
    ]);
    expect(result.totalInvestment).toBe(100000);
    expect(result.buckets.every((b) => b.percent >= 0 && b.percent <= 1)).toBe(true);
  });

  it('records which accounts feed each bucket', () => {
    const result = getWealthByTaxTreatment([
      account({ id: 'x1', name: 'Sean 401k', accountType: '401k', startingBalance: 100000, pretaxSharePercent: 70 }),
    ]);
    expect(bucketOf(result, 'pretax').accounts).toHaveLength(1);
    expect(bucketOf(result, 'pretax').accounts[0]).toMatchObject({ id: 'x1', name: 'Sean 401k', amount: 70000 });
    expect(bucketOf(result, 'roth').accounts[0]).toMatchObject({ id: 'x1', amount: 30000 });
  });

  it('handles an empty portfolio', () => {
    const result = getWealthByTaxTreatment([]);
    expect(result.totalInvestment).toBe(0);
    expect(result.buckets.every((b) => b.percent === 0)).toBe(true);
  });
});
