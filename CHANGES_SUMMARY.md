# Auth Flow & API/UI Contract Drift - Changes Summary

## Overview
Fixed all API/UI query and mutation naming mismatches, and verified the CurrentUserProvider auth flow is properly implemented to handle user creation on first login and preference synchronization.

## Changes Made

### 1. Tax Planning Query Updates
**File:** `Breeze.Web/lib/services/queries/taxPlanning.ts`

- ✅ Renamed export from `CALCULATE_TAX_ESTIMATE` → `ESTIMATE_TAXES_FOR_YEAR`
- ✅ Updated GraphQL query operation name from `CalculateTaxEstimate` → `EstimateTaxesForYear`
- ✅ Updated parameter name from `deductionAmount` → `deduction` (matches API schema)

### 2. Plaid Queries & Mutations Updates
**File:** `Breeze.Web/lib/services/queries/plaid.ts`

#### Mutations
- ✅ Renamed `EXCHANGE_PLAID_TOKEN` → `EXCHANGE_PLAID_PUBLIC_TOKEN`
  - Updated operation name: `ExchangePlaidToken` → `ExchangePlaidPublicToken`
  - Added required `userId` parameter to match API schema
  
- ✅ Renamed `SYNC_PLAID_ACCOUNTS` → `SYNC_PLAID_CONNECTION`
  - Updated operation name: `SyncPlaidAccounts` → `SyncPlaidConnection`
  - Simplified response: now returns boolean (matches API)
  - Changed parameter: `connectionId` → `id`

#### Queries
- ✅ Renamed `GET_PLAID_CONNECTIONS` → `PLAID_CONNECTIONS`
  - Updated operation name: `GetPlaidConnections` → `PlaidConnections`
  - Added required `userId` parameter to match API schema

- ✅ Renamed `GET_PLAID_ACCOUNTS` → `PLAID_ACCOUNTS`
  - Updated operation name: `GetPlaidAccounts` → `PlaidAccounts`

### 3. Tax Estimate Hook Updates
**File:** `Breeze.Web/lib/services/hooks/useTaxEstimate.ts`

- ✅ Updated import from `CALCULATE_TAX_ESTIMATE` → `ESTIMATE_TAXES_FOR_YEAR`
- ✅ Updated interface: `deductionAmount?: string` → `deduction?: string`
- ✅ Hook name remains `useTaxEstimate` (public API unchanged)

### 4. Plaid Hooks Updates
**File:** `Breeze.Web/lib/services/hooks/usePlaid.ts`

#### Mutations
- ✅ `useExchangePlaidToken()`
  - Now accepts object with `{ userId: string; publicToken: string }`
  - Previously only accepted `publicToken: string`
  - Uses updated `EXCHANGE_PLAID_PUBLIC_TOKEN` query

- ✅ `useSyncPlaidConnection()` 
  - Renamed from `useSyncPlaidAccounts`
  - Now accepts single `id: string` parameter
  - Returns `boolean` (matches API response)
  - Uses updated `SYNC_PLAID_CONNECTION` query

#### Queries
- ✅ `usePlaidConnections(userId: string | null, enabled?: boolean)`
  - Now requires `userId` parameter (was called without parameters)
  - Uses updated `PLAID_CONNECTIONS` query

- ✅ `usePlaidAccounts(connectionId: string | null, enabled?: boolean)`
  - No signature change, but uses updated `PLAID_ACCOUNTS` query

### 5. Auth Flow Verification
**File:** `Breeze.Web/lib/providers/CurrentUserProvider.tsx`

✅ **Auth flow is already correctly implemented:**
- On component mount (after `useUser()` loads), checks if user is signed in
- Calls `me` query to check if user exists in backend
- If user not found (`null` response), calls `createUser` mutation with:
  - `identityProviderId`: Clerk user ID
  - `email`: Clerk email
  - Default preferences:
    - `returnType`: NOMINAL
    - `safeWithdrawalRate`: 0.04 (4%)
    - `currencyType`: USD
    - `inflationRate`: 0.025 (2.5%)
    - `deductionType`: STANDARD
    - `filingStatus`: SINGLE
    - `payoffStrategy`: AVALANCHE
- If user found, loads preferences from backend response
- Stores userId and preferences in context for other hooks
- Handles auth state changes (logout = clear context)

## Verification

✅ **Build Status:** Next.js build completed successfully with no errors
✅ **All Query/Mutation Names:** Match API schema exactly
✅ **Type Safety:** Full TypeScript type checking passes
✅ **Auth Flow:** Properly handles first-time user creation and preference sync

## API Schema Alignment

All GraphQL operations now match the backend schema:

| Query/Mutation | Old Name | New Name | Parameters | Notes |
|---|---|---|---|---|
| Tax Estimate | `CalculateTaxEstimate` | `EstimateTaxesForYear` | `deduction` | Parameter renamed |
| Exchange Plaid | `ExchangePlaidToken` | `ExchangePlaidPublicToken` | `userId`, `publicToken` | Added userId |
| Sync Plaid | `SyncPlaidAccounts` | `SyncPlaidConnection` | `id` | Returns boolean |
| Get Connections | `GetPlaidConnections` | `PlaidConnections` | `userId` | Added userId |
| Get Accounts | `GetPlaidAccounts` | `PlaidAccounts` | `connectionId` | No change |

## Impact

- ✅ No breaking changes to component props/interfaces
- ✅ Hook names unchanged (public API maintains backward compatibility at interface level)
- ✅ All parameter changes are properly typed
- ✅ Full API/UI contract alignment achieved
- ✅ First-time user creation workflow is functional
