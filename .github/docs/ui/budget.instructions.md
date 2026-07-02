---
applyTo: "breeze.web/app/budget/**"
---

# Budget Module Instructions

## Purpose

Define coding patterns for budget module changes so behavior stays consistent across hooks, provider state, and UI components.

## Rules

- Keep API payload IDs and monetary fields as strings.
- Keep data access in hooks/providers; presentation components should not call transport utilities directly.
- Use stable React Query keys and `enabled` guards for ID-dependent reads.
- On successful mutations, invalidate/refetch all affected budget views.

## Where To Add Changes

- GraphQL operations: `breeze.web/lib/services/queries/budget.ts`
- Domain hooks: `breeze.web/app/budget/hooks/<domain>/`
- Shared budget orchestration: `breeze.web/app/budget/providers/BudgetProvider.tsx`
- Route UI: `breeze.web/app/budget/page.tsx` and `breeze.web/app/budget/components/`

## Query Pattern

```tsx
return useQuery({
  queryKey: ['budget-expenses', budgetId],
  queryFn: () => getExpensesForBudget(budgetId),
  enabled: !!budgetId,
});
```

## Mutation Pattern

```tsx
const mutation = useMutation({
  mutationFn: postExpense,
  onSuccess: async () => {
    await Promise.all([refetchBudget(), refetchExpenses(), refetchCategories()]);
  },
});
```

## Validation Checklist

- [ ] Query key is stable and domain-scoped
- [ ] `enabled` guard exists for required IDs
- [ ] Loading/error/success states are visible in UI
- [ ] Dependent views refresh after mutation success
- [ ] `npm run check` passes in `breeze.web`
