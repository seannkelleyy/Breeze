# Budget Module

Current budget module docs for contributors working in `breeze.web/app/budget`.

## Scope

This module owns month-based budgeting flows:

- monthly budget fetch by date
- incomes, expenses, and categories CRUD
- expense split handling
- recurring template regeneration for the selected month
- budget summary calculations used by page-level UI

## Data and API Conventions

- GraphQL IDs are strings.
- Monetary values are sent over GraphQL as strings.
- UI may convert strings to numbers for calculations/display only.
- Query/mutation definitions live in `breeze.web/lib/services/queries/budget.ts`.

## Primary Entry Points

- `page.tsx` — route-level budget page
- `providers/BudgetProvider.tsx` — shared budget context and refetch orchestration
- `hooks/budget/` — budget lifecycle hooks (fetch/update/regenerate)
- `hooks/income/`, `hooks/expense/`, `hooks/category/` — domain CRUD hooks
- `components/` — dialogs, tables, and summaries

## Common Workflow

1. Add or update GraphQL operation in `lib/services/queries/budget.ts`.
2. Add or update a focused hook under the matching `hooks/<domain>/` folder.
3. Wire UI state into provider/page/components.
4. Ensure query invalidation or refetch behavior is explicit.
5. Run validation in `breeze.web`:

```bash
npm run lint
npm run build
```

## Known Gaps

- Budget pages are still orchestration-heavy and can be split into smaller composable containers.
- Plaid-connected account data is not yet fully reflected in budget UI workflows.

## Related Docs

- `../../../.github/docs/ui/01-stack.md`
- `../../../.github/docs/ui/ui-slice-api-checklist.md`
- `../../../.github/docs/api/06-vertical-slice.md`
