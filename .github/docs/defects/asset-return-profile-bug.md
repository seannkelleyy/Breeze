# Defect: Asset Return Profile Selector Does Not Update

## Status
Unresolved

## Environment
- Planner page → Accounts card → Return Profile dropdown
- Display Mode: Real / Nominal (both affected)

## Symptoms
- When selecting a Return Profile option (e.g. "Stocks", "Bonds"), the dropdown value remains "None" or snaps back
- The selected profile does not persist visually after selection
- Data may or may not be persisted to the API - the UI always resets

## Attempted Fixes (All Applied)

### Fix 1: Removed redundant `getStoredAnnualRateForInput` wrapper
**File:** `breeze.web/app/planner/components/accounts/InvestmentAccountFields.tsx`
**Change:** Removed `getStoredAnnualRateForInput` from the `onValueChange` handler of the profile `<Select>`. `getAnnualRateFromProfile` already returns the stored nominal rate, so wrapping it again caused a double real→nominal conversion in real display mode.

### Fix 2: Only convert custom profiles in `getAccountAnnualRateFromProfile`
**File:** `breeze.web/app/planner/lib/plannerMath.ts`
**Change:** Changed `return u ? getNominalAnnualRatePercentFromReal(n, i) : n;` to `return p === 'custom' && u ? getNominalAnnualRatePercentFromReal(n, i) : n;`
**Reason:** Standard profile rates (0, 3, 4, 7, 10) are already nominal rates. Only custom rates typed by the user need real→nominal conversion.

### Fix 3: Corrected hardcoded rate values and thresholds
**File:** `breeze.web/app/planner/lib/plannerMath.ts`
**Changes:**
- `getAccountAnnualRateFromProfile` - `R` map had wrong values: `2.5, 3.5, 6, 8` instead of the correct `3, 4, 7, 10` from `PLANNER_ACCOUNT_RATE_PROFILE_RATES`
- `getAccountRateProfileFromAnnualRate` - Thresholds were tuned for wrong rates. Now using midpoints: 1.5, 3.5, 5.5, 8.5, 10

## Important Observation: `annualRate` Gets Overwritten

In `breeze.web/app/planner/hooks/planner/usePlannerAccounts.ts` line 121-124, the `updateAssetFinanceDetails` function calls `updateAccount` and **overwrites `annualRate`** with `nextDetails.annualChangeRate`:

```typescript
updateAccount(accountId, (c) => ({
  ...c,
  startingBalance: clamp(nextDetails.currentValue),
  annualRate: nextDetails.annualChangeRate,
}));
```

This means any change to `AssetFinanceDetails` (e.g. home/vehicle data) will clobber the account's `annualRate`. While this is intended for combined asset types (home/vehicle), if the `onUpdateAssetFinanceDetails` function is somehow triggered for non-combined investment accounts, or if this runs during a React re-render cycle after a profile change, it could undo the profile selection.

## Root Cause Analysis (Unconfirmed)

The following circular dependency between profile-to-rate and rate-to-profile conversions may still have issues:

### Conversion logic flow:
```
User selects profile → getAccountAnnualRateFromProfile → stores annualRate
                      → re-render → getAccountRateProfileFromAnnualRate(read back stored rate) → shows profile
```

### Potential remaining issues:

1. **getAccountRateProfileFromAnnualRate receives a DISPLAYED rate** (not stored rate)
   - In `AccountListItem.tsx:153`: `getRateProfileFromAnnualRate(getDisplayedRateForAccount(account))`
   - `getDisplayedRateForAccount` returns real rate when in real mode
   - `getAccountRateProfileFromAnnualRate` then converts back via `getNominalAnnualRatePercentFromReal`
   - This round-trip should be lossless, but floating point may cause edge cases

2. **Initial account creation may set wrong annualRate**
   - `PLANNER_DEFAULT_NEW_ACCOUNT` does not include an `annualRate` field
   - `addAccount()` sets `annualRate: weightedAnnualRate` (defaults to 0)
   - An account with `annualRate = 0` displays as "None" profile
   - Selecting a profile should update this, but could have timing issues

3. **React state closure issue**
   - The `onValueChange` callback closes over `getAnnualRateFromProfile` and `getDisplayedRateForAccount`, which depend on `inflationRate` and `useInflationAdjustedValues`
   - If these values change, stale closures could cause incorrect calculations

4. **Component key/mount issue**
   - The `<Select>` component might be remounting due to key changes, losing its internal state
   - The `selectedRateProfile` value is computed, not stored in state

## Reproduction Steps
1. Navigate to Planner page
2. Add or select an existing Asset account
3. Expand the account form
4. Locate "Return Profile" dropdown
5. Select any option other than "None" (e.g., "Stocks" or "Bonds")
6. Observe: dropdown either snaps back to "None" or changes briefly then reverts

## Affected Files
- `breeze.web/app/planner/components/accounts/InvestmentAccountFields.tsx`
- `breeze.web/app/planner/lib/plannerMath.ts` (`getAccountAnnualRateFromProfile`, `getAccountRateProfileFromAnnualRate`)
- `breeze.web/app/planner/lib/constants.ts` (`PLANNER_ACCOUNT_RATE_PROFILE_RATES`)
- `breeze.web/app/planner/hooks/planner/usePlannerAccounts.ts`
- `breeze.web/app/planner/components/accounts/AccountListItem.tsx`

## Suggested Debugging Approach
1. Add `console.log` in `getAccountAnnualRateFromProfile` and `getAccountRateProfileFromAnnualRate` to trace the actual values
2. Add `console.log` in `InvestmentAccountFields.tsx` profile `onValueChange` to see what value is being set
3. Check if the `annualRate` on the account object actually changes in React DevTools
4. Verify the `accountRateProfileOptions` values match `selectedRateProfile` type
5. Check for stale closures by examining `useCallback`/`useMemo` dependencies