---
applyTo: "breeze.web/app/planner/components/**"
---

# Web UI — Component Instructions

This file provides patterns and conventions for React components in Breeze's planner module.

## Component Architecture

- All planner components are `'use client'` — they manage form state and React Query hooks.
- Components receive data and callbacks via props from parent containers.
- Form state is local (`useState` or React Hook Form), saved on blur or explicit save button.

## UI Component Library

Components use **shadcn/ui** (Radix primitives + Tailwind v4):

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

## Select Patterns

Dropdowns follow this pattern:

```tsx
<Select
  value={account.accountType}
  onValueChange={(value) =>
    onUpdateAccount((current) => ({
      ...current,
      accountType: value as AccountType,
    }))
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Select type" />
  </SelectTrigger>
  <SelectContent>
    {options.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

- Options are passed as `ReadonlyArray<{ value: string; label: string }>` from the parent hook.
- The parent (`usePlannerAccounts`) pre-computes all option arrays centrally.

## Formatted Number Input

Monetary and rate inputs use a shared `FormattedNumberInput` component:

```tsx
import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput';

<FormattedNumberInput
  value={account.startingBalance}
  onValueChange={(value) =>
    onUpdateAccount((current) => ({ ...current, startingBalance: value }))
  }
  maxFractionDigits={2}
/>
```

## Conditional Rendering Pattern

Components use type guards to conditionally render sections:

```tsx
{isLiabilityAccountType(account.accountType) ? (
  <LiabilityAccountFields account={account} onUpdateAccount={onUpdateAccount} />
) : isCombinedAssetType(account.accountType) ? (
  <CombinedAssetLoanFields ... />
) : (
  <InvestmentAccountFields ... />
)}
```

## File Structure

```
components/
├── accounts/
│   ├── AccountListItem.tsx          # Renders a single account (type-based sub-fields)
│   ├── LiabilityAccountFields.tsx   # Balance, rate, payment fields
│   ├── InvestmentAccountFields.tsx  # Contribution fields
│   ├── HomeAccountFields.tsx        # Home-specific fields
│   ├── VehicleAccountFields.tsx     # Vehicle-specific fields
│   └── CombinedAssetLoanFields.tsx  # Asset + loan fields
└── AccountsCard.tsx                 # Main card container with filter/sort/add
```

## Key Conventions

- **Type guards** come from `usePlannerAccounts()` — `isLiabilityAccountType`, `isCombinedAssetType`, etc.
- **Options** come from `usePlannerAccounts()` — `accountTypeOptions`, `accountOwnerOptions`, etc.
- **Account updates** go through `onUpdateAccount` callback (functional updater pattern).
- **Collapse state** is tracked by `collapsedAccountIds` keyed by account ID.
- **Currency formatting** uses `formatCurrencyWithCode(value, currencyCode)` from `../lib/plannerMath`.
