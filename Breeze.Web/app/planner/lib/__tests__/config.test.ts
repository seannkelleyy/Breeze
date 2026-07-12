import { describe, it, expect } from 'vitest';
import {
  isLiabilityAccountType,
  isNonContributingAccountType,
  isDepreciatingAssetType,
  isCombinedAssetType,
  accountTypesWithoutIrsLimits,
} from '../config';
import type { AccountType } from '../../types/account';

describe('isLiabilityAccountType', () => {
  it('returns true for all liability types', () => {
    const liabilities: AccountType[] = [
      'student-loan',
      'credit-card',
      'personal-loan',
      'auto-loan',
      'mortgage',
    ];
    for (const type of liabilities) {
      expect(isLiabilityAccountType(type)).toBe(true);
    }
  });

  it('returns false for asset types', () => {
    const assets: AccountType[] = ['401k', 'roth-ira', 'checking', 'brokerage', 'home', 'vehicle'];
    for (const type of assets) {
      expect(isLiabilityAccountType(type)).toBe(false);
    }
  });
});

describe('isNonContributingAccountType', () => {
  it('returns true for home and vehicle', () => {
    expect(isNonContributingAccountType('home')).toBe(true);
    expect(isNonContributingAccountType('vehicle')).toBe(true);
  });

  it('returns false for contributing types', () => {
    expect(isNonContributingAccountType('401k')).toBe(false);
    expect(isNonContributingAccountType('checking')).toBe(false);
    expect(isNonContributingAccountType('brokerage')).toBe(false);
  });
});

describe('isDepreciatingAssetType', () => {
  it('returns true for vehicle', () => {
    expect(isDepreciatingAssetType('vehicle')).toBe(true);
  });

  it('returns false for non-depreciating types', () => {
    expect(isDepreciatingAssetType('home')).toBe(false);
    expect(isDepreciatingAssetType('401k')).toBe(false);
    expect(isDepreciatingAssetType('checking')).toBe(false);
  });
});

describe('isCombinedAssetType', () => {
  it('returns true for home and vehicle', () => {
    expect(isCombinedAssetType('home')).toBe(true);
    expect(isCombinedAssetType('vehicle')).toBe(true);
  });

  it('returns false for other types', () => {
    expect(isCombinedAssetType('401k')).toBe(false);
    expect(isCombinedAssetType('checking')).toBe(false);
    expect(isCombinedAssetType('brokerage')).toBe(false);
  });
});

describe('accountTypesWithoutIrsLimits', () => {
  it('includes non-retirement types', () => {
    expect(accountTypesWithoutIrsLimits.has('brokerage')).toBe(true);
    expect(accountTypesWithoutIrsLimits.has('checking')).toBe(true);
    expect(accountTypesWithoutIrsLimits.has('home')).toBe(true);
    expect(accountTypesWithoutIrsLimits.has('vehicle')).toBe(true);
    expect(accountTypesWithoutIrsLimits.has('other')).toBe(true);
  });

  it('includes liability types', () => {
    expect(accountTypesWithoutIrsLimits.has('student-loan')).toBe(true);
    expect(accountTypesWithoutIrsLimits.has('credit-card')).toBe(true);
    expect(accountTypesWithoutIrsLimits.has('mortgage')).toBe(true);
  });

  it('excludes retirement account types', () => {
    expect(accountTypesWithoutIrsLimits.has('401k')).toBe(false);
    expect(accountTypesWithoutIrsLimits.has('roth-ira')).toBe(false);
    expect(accountTypesWithoutIrsLimits.has('traditional-ira')).toBe(false);
    expect(accountTypesWithoutIrsLimits.has('hsa')).toBe(false);
    expect(accountTypesWithoutIrsLimits.has('403b')).toBe(false);
    expect(accountTypesWithoutIrsLimits.has('457')).toBe(false);
  });
});
