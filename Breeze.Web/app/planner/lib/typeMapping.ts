/**
 * Type mapping between Planner AccountType (frontend display types)
 * and ApiAssetType (backend GraphQL/DB enum values).
 *
 * Backend enums use UPPER_SNAKE_CASE with underscore prefix for numeric-starting
 * values (_401K, _403B, _457) since PostgreSQL/GraphQL enums can't start with digits.
 */

import type { AccountType } from '../types/account';
import type { ApiAssetType } from '../types/apiAsset';

/**
 * Maps a frontend AccountType to the corresponding backend ApiAssetType.
 * Returns null for liability types (which use a separate liability_type enum in the backend).
 */
export function accountTypeToApiAssetType(accountType: AccountType): ApiAssetType | null {
  const mapping: Partial<Record<AccountType, ApiAssetType | null>> = {
    checking: 'CHECKING',
    'emergency-fund': 'EMERGENCY_FUND',
    brokerage: 'BROKERAGE',
    '401k': '_401K',
    '403b': '_403B',
    '457': '_457',
    'roth-ira': 'ROTH_IRA',
    'traditional-ira': 'TRADITIONAL_IRA',
    hsa: 'HSA',
    home: 'HOME',
    vehicle: 'VEHICLE',
    other: 'OTHER',
    // Liability types map to null — they use liability_type in the backend
    'student-loan': null,
    'credit-card': null,
    'personal-loan': null,
    'auto-loan': null,
    mortgage: null,
  };

  return mapping[accountType] ?? null;
}

/**
 * Maps a backend ApiAssetType to the corresponding frontend AccountType.
 */
export function apiAssetTypeToAccountType(apiType: ApiAssetType): AccountType {
  const mapping: Record<ApiAssetType, AccountType> = {
    CHECKING: 'checking',
    EMERGENCY_FUND: 'emergency-fund',
    BROKERAGE: 'brokerage',
    _401K: '401k',
    _403B: '403b',
    _457: '457',
    ROTH_IRA: 'roth-ira',
    TRADITIONAL_IRA: 'traditional-ira',
    HSA: 'hsa',
    HOME: 'home',
    VEHICLE: 'vehicle',
    OTHER: 'other',
  };

  return mapping[apiType];
}
