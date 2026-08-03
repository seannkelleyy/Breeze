---
applyTo: "breeze.web/app/budget/**"
---

# Budget Module Instructions

## Purpose

Define coding patterns for budget module changes so behavior stays consistent across hooks, provider state, and UI components.

## Scope

The budget module owns month-based budgeting flows:

- monthly budget fetch by date
- incomes, expenses, and categories CRUD
- expense split handling
- recurring template regeneration for the selected month
- budget summary calculations used by page-level UI

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

## Data Modeling

Keep conversion at boundaries:

- API payloads: string money
- UI calculations: number as needed
- Persisted outbound payloads: string money

## Recurring Template Behavior

1. Add request/mutation in `hooks/recurring/recurringTemplateServices.ts`.
2. Trigger from `components/recurring/RecurringTemplatesDialog.tsx` or related sections.
3. Refetch budget/income/category data after success.

## Validation Checklist

- [ ] GraphQL operation added or reused
- [ ] Hook added in the correct domain folder
- [ ] Query key is stable and domain-scoped
- [ ] `enabled` guard exists for required IDs
- [ ] Mutation success behavior refreshes dependent data
- [ ] Loading/error/success states are visible in UI
- [ ] `npm run check` passes in `breeze.web`

## Known Gaps

- Budget pages are still orchestration-heavy and can be split into smaller composable containers.
- Plaid-connected account data is not yet fully reflected in budget UI workflows.
