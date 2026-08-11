import { describe, it, expect } from 'vitest';
import { PlannerPerson } from '../../types/person';
import { PlannerAccount } from '../../types/account';
import { getDefaultAssetFinanceDetailsForAccount } from '../plannerMath';

describe('getDefaultAssetFinanceDetailsForAccount', () => {
  const basePerson: PlannerPerson = {
    id: 'person-1',
    name: 'Alice',
    birthday: '1990-01-01',
    retirementAge: 65,
    annualSalary: 100000,
    bonusMode: 'dollars',
    annualBonus: 0,
    incomeGrowthRate: 0,
  };

  it('returns default details for home account', () => {
    const account: PlannerAccount = {
      id: 'account-1',
      name: 'My Home',
      accountType: 'home',
      personIds: ['person-1'],
      contributionMode: 'monthly',
      contributionValue: 0,
      employerMatchRate: 0,
      employerMatchMaxPercentOfSalary: 0,
      startingBalance: 350000,
      annualRate: 4,
      returnProfile: null,
      purchaseDate: '2020-01-01',
      purchasePrice: 300000,
      homeGrowthProfile: 'moderate',
      vehicleDepreciationProfile: null,
      linkedLiabilityId: null,
      plaidAccountId: null,
      originalLoanAmount: null,
    };

    const details = getDefaultAssetFinanceDetailsForAccount(account);

    expect(details).toBeDefined();
    expect(details.hasLoan).toBe(false);
    expect(details.currentLoanBalance).toBe(0);
    expect(details.loanMonthlyPayment).toBe(0);
  });

  it('returns default details for vehicle account', () => {
    const account: PlannerAccount = {
      id: 'account-2',
      name: 'My Car',
      accountType: 'vehicle',
      personIds: ['person-1'],
      contributionMode: 'monthly',
      contributionValue: 0,
      employerMatchRate: 0,
      employerMatchMaxPercentOfSalary: 0,
      startingBalance: 25000,
      annualRate: -12,
      returnProfile: null,
      purchaseDate: '2023-01-01',
      purchasePrice: 30000,
      homeGrowthProfile: null,
      vehicleDepreciationProfile: 'standard',
      linkedLiabilityId: null,
      plaidAccountId: null,
      originalLoanAmount: null,
    };

    const details = getDefaultAssetFinanceDetailsForAccount(account);

    expect(details).toBeDefined();
    expect(details.hasLoan).toBe(false);
  });

  it('returns default details for non-combined asset', () => {
    const account: PlannerAccount = {
      id: 'account-3',
      name: '401k',
      accountType: '401k',
      personIds: ['person-1'],
      contributionMode: 'monthly',
      contributionValue: 1625,
      employerMatchRate: 6,
      employerMatchMaxPercentOfSalary: 50,
      startingBalance: 100000,
      annualRate: 10,
      returnProfile: 'stocks',
      purchaseDate: null,
      purchasePrice: null,
      homeGrowthProfile: null,
      vehicleDepreciationProfile: null,
      linkedLiabilityId: null,
      plaidAccountId: null,
      originalLoanAmount: null,
    };

    const details = getDefaultAssetFinanceDetailsForAccount(account);

    expect(details).toBeDefined();
  });
});

describe('PlannerAccount type', () => {
  it('allows all account types', () => {
    const types = [
      'checking', 'emergency-fund', 'brokerage', '401k', '403b', '457',
      'roth-ira', 'traditional-ira', 'hsa', 'home', 'vehicle', 'other',
      'student-loan', 'credit-card', 'personal-loan', 'auto-loan', 'mortgage',
    ];

    types.forEach((type) => {
      const account: PlannerAccount = {
        id: 'test',
        name: 'Test',
        accountType: type as any,
        personIds: [],
        contributionMode: 'monthly',
        contributionValue: 0,
        employerMatchRate: 0,
        employerMatchMaxPercentOfSalary: 0,
        startingBalance: 0,
        annualRate: 0,
        returnProfile: null,
        purchaseDate: null,
        purchasePrice: null,
        homeGrowthProfile: null,
        vehicleDepreciationProfile: null,
        linkedLiabilityId: null,
        plaidAccountId: null,
        originalLoanAmount: null,
      };
      expect(account.accountType).toBe(type);
    });
  });
});
