---
applyTo: "breeze.web/features/planning/hooks/planner/**"
---

# Web UI — Hooks Instructions

This file provides patterns for TanStack React Query hooks used in Breeze's planner module.

## Query Convention

User-owned query hooks read identity from `CurrentUserProvider`, include it in the cache key, and wait until it is available before fetching:

```tsx
export function useAssets() {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['assets', userId],
    queryFn: async () => {
      const response = await request(GET_ASSETS_BY_USER);
      return response.assets ?? [];
    },
    enabled: Boolean(userId),
  });
}
```

Use stable domain-first keys; append resource IDs and filters after `userId` when needed (for example, `['budget', userId, month]`). The authenticated GraphQL transport supplies the caller identity, so do not send `userId` just to identify the signed-in user.

## Mutation Convention

Mutation hooks own requests and cache updates. Invalidate affected keys after success, scoped to the current user where appropriate:

```tsx
export function useCreateGoal() {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const queryKey = goalQueryKeys.byUser(userId);

  return useMutation({
    mutationFn: (input: CreateGoalInput) => api.createGoal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
```

## Domain Hooks Pattern

Domain hooks that combine multiple queries and provide derived state follow this pattern:

```tsx
export function usePlannerAccounts() {
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: liabilities, isLoading: liabilitiesLoading } = useLiabilities();

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
features/planning/hooks/
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

- **Query keys** use a stable domain-first hierarchy; user-owned data includes `userId` before resource IDs or filters.
- **Domain hooks** return a consistent shape: `{ data, options, typeGuards, helpers, actions }`.
- **Options** are pre-computed `useMemo` arrays — never recomputed per render.
- **Type guards** are stable function references — never recreated per render.
- **API calls** go through `useGraphql()` inside feature hooks; components do not own transport or React Query orchestration.
- **User bootstrap** is handled once by `CurrentUserProvider` — never duplicated in domain hooks.
