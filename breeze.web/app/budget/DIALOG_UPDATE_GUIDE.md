# Budget Feature Patterns Guide

This guide is the active implementation pattern for adding or changing budget functionality.

Use it with:

- `breeze.web/app/budget/README.md`
- `docs/ui/ui-slice-api-checklist.md`
- `docs/api/06-vertical-slice.md`

## Core Rules

- Keep API wire IDs and money values as strings.
- Use focused hooks in domain folders (`hooks/income`, `hooks/expense`, `hooks/category`, `hooks/goal`).
- Keep page-level orchestration in `page.tsx` and shared state/refetch in `providers/BudgetProvider.tsx`.
- Use explicit query invalidation or explicit refetch after mutations.

## Where to Add Code

### New GraphQL operation

1. Add operation in `breeze.web/lib/services/queries/budget.ts`.
2. Add/update domain service hook (`useIncomes`, `useExpenses`, etc.).
3. Add/update query or mutation hook in the matching domain folder.

### New budget UI behavior

1. Add UI component under `components/`.
2. Read data through existing hooks/context instead of direct transport calls.
3. Keep side effects in hooks/providers, not in presentation components.

### New recurring-template behavior

1. Add request/mutation in `hooks/recurring/recurringTemplateServices.ts`.
2. Trigger from `components/recurring/RecurringTemplatesDialog.tsx` or related sections.
3. Refetch budget/income/category data after success.

## Query and Mutation Pattern

Use stable query keys and guard execution when IDs are not ready.

```typescript
return useQuery({
  queryKey: ['expense', budgetId],
  queryFn: () => getExpensesForBudget(budgetId),
  enabled: !!budgetId,
});
```

```typescript
const mutation = useMutation({
  mutationFn: postExpense,
  onSuccess: async () => {
    await Promise.all([refetchBudget(), refetchExpenses(), refetchCategories()]);
  },
});
```

## Data Modeling Pattern

- Budget types live in `types/`.
- Keep conversion at boundaries:
  - API payloads: string money
  - UI calculations: number as needed
  - Persisted outbound payloads: string money

## Add-Functionality Checklist

- [ ] GraphQL operation added or reused
- [ ] Hook added in the correct domain folder
- [ ] Query key stable and scoped
- [ ] `enabled` guard present for ID-dependent reads
- [ ] Mutation success behavior refreshes dependent data
- [ ] Error state shown in UI
- [ ] Loading state shown in UI
- [ ] Build/lint passes

## Validation Commands

From `breeze.web`:

```bash
npm run typecheck
npm run lint
npm run build
```

From `breeze.api` when API contract changed:

```bash
make gen
make check
```
