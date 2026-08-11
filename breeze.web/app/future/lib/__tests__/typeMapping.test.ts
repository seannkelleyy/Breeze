import { describe, it, expect } from 'vitest';
import { accountTypeToApiAssetType, apiAssetTypeToAccountType } from '../typeMapping';
import { AccountType } from '../../types/account';

describe('accountTypeToApiAssetType', () => {
  it('maps checking to CHECKING', () => {
    expect(accountTypeToApiAssetType('checking')).toBe('CHECKING');
  });

  it('maps 401k to _401K', () => {
    expect(accountTypeToApiAssetType('401k')).toBe('_401K');
  });

  it('maps roth-ira to ROTH_IRA', () => {
    expect(accountTypeToApiAssetType('roth-ira')).toBe('ROTH_IRA');
  });

  it('maps traditional-ira to TRADITIONAL_IRA', () => {
    expect(accountTypeToApiAssetType('traditional-ira')).toBe('TRADITIONAL_IRA');
  });

  it('maps hsa to HSA', () => {
    expect(accountTypeToApiAssetType('hsa')).toBe('HSA');
  });

  it('maps home to HOME', () => {
    expect(accountTypeToApiAssetType('home')).toBe('HOME');
  });

  it('maps vehicle to VEHICLE', () => {
    expect(accountTypeToApiAssetType('vehicle')).toBe('VEHICLE');
  });

  it('maps brokerage to BROKERAGE', () => {
    expect(accountTypeToApiAssetType('brokerage')).toBe('BROKERAGE');
  });

  it('maps emergency-fund to EMERGENCY_FUND', () => {
    expect(accountTypeToApiAssetType('emergency-fund')).toBe('EMERGENCY_FUND');
  });

  it('returns null for liability types', () => {
    expect(accountTypeToApiAssetType('mortgage')).toBeNull();
    expect(accountTypeToApiAssetType('credit-card')).toBeNull();
    expect(accountTypeToApiAssetType('student-loan')).toBeNull();
    expect(accountTypeToApiAssetType('auto-loan')).toBeNull();
    expect(accountTypeToApiAssetType('personal-loan')).toBeNull();
  });

  it('maps other to OTHER', () => {
    expect(accountTypeToApiAssetType('other')).toBe('OTHER');
  });
});

describe('apiAssetTypeToAccountType', () => {
  it('maps CHECKING to checking', () => {
    expect(apiAssetTypeToAccountType('CHECKING')).toBe('checking');
  });

  it('maps _401K to 401k', () => {
    expect(apiAssetTypeToAccountType('_401K')).toBe('401k');
  });

  it('maps _403B to 403b', () => {
    expect(apiAssetTypeToAccountType('_403B')).toBe('403b');
  });

  it('maps _457 to 457', () => {
    expect(apiAssetTypeToAccountType('_457')).toBe('457');
  });

  it('maps ROTH_IRA to roth-ira', () => {
    expect(apiAssetTypeToAccountType('ROTH_IRA')).toBe('roth-ira');
  });

  it('maps TRADITIONAL_IRA to traditional-ira', () => {
    expect(apiAssetTypeToAccountType('TRADITIONAL_IRA')).toBe('traditional-ira');
  });

  it('maps HSA to hsa', () => {
    expect(apiAssetTypeToAccountType('HSA')).toBe('hsa');
  });

  it('maps BROKERAGE to brokerage', () => {
    expect(apiAssetTypeToAccountType('BROKERAGE')).toBe('brokerage');
  });

  it('maps HOME to home', () => {
    expect(apiAssetTypeToAccountType('HOME')).toBe('home');
  });

  it('maps VEHICLE to vehicle', () => {
    expect(apiAssetTypeToAccountType('VEHICLE')).toBe('vehicle');
  });

  it('maps EMERGENCY_FUND to emergency-fund', () => {
    expect(apiAssetTypeToAccountType('EMERGENCY_FUND')).toBe('emergency-fund');
  });

  it('maps OTHER to other', () => {
    expect(apiAssetTypeToAccountType('OTHER')).toBe('other');
  });
});

describe('round-trip mapping', () => {
  const assetTypes = [
    'checking', 'emergency-fund', 'brokerage', '401k', '403b', '457',
    'roth-ira', 'traditional-ira', 'hsa', 'home', 'vehicle', 'other',
  ];

  assetTypes.forEach((type) => {
    it(`round-trips ${type}`, () => {
      const apiType = accountTypeToApiAssetType(type as AccountType);
      expect(apiType).not.toBeNull();
      const backType = apiAssetTypeToAccountType(apiType!);
      expect(backType).toBe(type);
    });
  });
});
