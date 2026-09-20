---
applyTo: "breeze.web/app/future/hooks/planner/**"
---

# Web UI — Hooks Instructions

This file provides patterns for TanStack React Query hooks used in Breeze's planner module.

## Query Convention

Every query hook follows this pattern:

```tsx
export function useAssets(userId: string) {
  return useQuery({
    queryKey: ['api-assets', userId],
    queryFn: () => request(GET_ASSETS, { userId }),
    enabled: !!userId,
  });
}
```

**Stable query key convention:** `['api-<slice>', userId]` — always include the user ID to scope per user.

## Mutation Convention

Every mutation hook follows this pattern:

```tsx
export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssetInput) => request(CREATE_ASSET, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-assets'] });
      queryClient.invalidateQueries({ queryKey: ['api-asset-liabilities'] });
    },
  });
}
```

- Invalidate all affected query keys in `onSuccess`.
- Do not invalidate inside `onSettled` — only on success.

## Domain Hooks Pattern

Domain hooks that combine multiple queries and provide derived state follow this pattern:

```tsx
export function usePlannerAccounts() {
  const { userId } = useCurrentUser();
  const { data: assets, isLoading: assetsLoading } = useAssets(userId);
  const { data: liabilities, isLoading: liabilitiesLoading } = useLiabilities(userId);

  const plannerAccounts = useMemo(() => {
    // merge assets + liabilities into PlannerAccount[]
    return [...mapAssets(assets), ...mapLiabilities(liabilities)];
  }, [assets, liabilities]);

  const options = useMemo(() => ({
    accountTypeOptions: ACCOUNT_TYPE_OPTIONS,
    accountOwnerOptions: ACCOUNT_OWNER_OPTIONS,
    // ...
  }), []);

  return {
    data: { plannerAccounts, /* ... */ },
    options,
    typeGuards: { isLiabilityAccountType, /* ... */ },
    helpers: { getEmployeeMonthlyContribution, /* ... */ },
    actions: { addAccount, updateAccount, deleteAccount, /* ... */ },
  };
}
```

## File Structure

```
app/future/hooks/
├── planner/
│   ├── usePlannerAccounts.ts    # Merges assets + liabilities into PlannerAccount[] (data/options/typeGuards/helpers/actions)
│   ├── usePlannerModel.ts       # Orchestrator over model/ hooks (household, portfolio, targets, projections)
│   ├── model/                   # Focused computation hooks extracted from usePlannerModel
│   ├── usePlannerPeople.ts      # Person management
│   ├── usePersonMutations.ts    # Planner person upsert/delete mutations
│   ├── usePaycheckDeductions.ts # Per-person paycheck withholding CRUD (query keyed by person, or 'all')
│   ├── useAccountMutations.ts   # Asset/liability create/update/delete mutations
│   ├── useIrsLimits.ts          # IRS contribution limits
│   ├── useTaxYear.ts            # Tax tables from the taxYearData query
│   └── useFetchPlanner.ts       # Server data fetching
├── usePlannerHydration.ts       # Hydrates planner state from the server on mount
└── usePlannerUiState.ts         # Collapsed-section UI state
```

## Key Conventions

- **Query keys** are always arrays starting with `'api-<name>'`.
- **Domain hooks** return a consistent shape: `{ data, options, typeGuards, helpers, actions }`.
- **Options** are pre-computed `useMemo` arrays — never recomputed per render.
- **Type guards** are stable function references — never recreated per render.
- **API calls** go through `useGraphql()` or direct Axios calls using `request()` from `lib/services/`.
- **User bootstrap** is handled once by `CurrentUserProvider` — never duplicated in domain hooks.
