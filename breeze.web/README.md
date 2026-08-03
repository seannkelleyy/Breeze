# Breeze Web

Next.js frontend for Breeze (personal finance planner).

## Prerequisites

- Node.js 20+
- npm 10+
- API running locally at `http://localhost:8080`

## Quick Start

```bash
cd breeze.web
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run check
npm run gen
```

## Auth and API Notes

- Clerk is used for frontend auth (`@clerk/nextjs`).
- GraphQL requests are sent through `lib/services/useGraphql.ts`.
- User bootstrap and profile state live in `lib/providers/CurrentUserProvider.tsx`.

## Module Entry Points

- `app/planner/` — planning experience (accounts, projections, retirement math)
- `app/budget/` — budgeting workflow and dialogs
- `app/plaid-connections/` — Plaid connect/sync UI
- `components/ui/` — shared shadcn components

## Related Docs

- `../docs/README.md`
- `../docs/ui/01-stack.md`
- `../docs/ui/ui-slice-api-checklist.md`
- `../docs/api/04-dev-workflow.md`
- `../docs/api/06-vertical-slice.md`
