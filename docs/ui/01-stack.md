# 01 — Frontend (Web App)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 + React 19 | App Router, server/client components |
| UI components | shadcn/ui + Radix + Tailwind v4 | Owned in repo, not node_modules |
| Data fetching | TanStack React Query v5 | Stable cache keys, mutations, invalidation |
| HTTP client | Axios | Direct HTTP calls to GraphQL endpoint |
| Auth | Clerk (`@clerk/clerk-react`) | Client-side SPA auth, CurrentUserProvider |
| Forms | React Hook Form + Zod | Pairs with shadcn form components |
| Charts | Recharts | Works with Tailwind, included in shadcn chart |
| Memoization | React Compiler (build-time) | Auto-memoizes components/hooks; manual memos only for identity |
| Package manager | npm | |

---

## Quick Start

**Prerequisites:** Node.js 20+, npm 10+, API running at `http://localhost:8080`

```bash
cd breeze.web
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Common Commands

```bash
npm run dev        # start dev server
npm run build      # static export to out/
npm run lint       # ESLint check
npm run typecheck  # TypeScript check
npm run check      # typecheck + lint + build
npm run test       # Vitest
```

### Navigation

The nav bar is grouped: `components/common/navigation/navConfig.ts` is the
single source of truth — `routeNavItems` feeds the mobile bottom tab bar,
`navGroups` renders the desktop dropdowns (Money, Plan), and
`secondaryNavItems` surfaces under the mobile "More" menu. Add new routes
there; the components render from config.

### Module Entry Points

- `app/future/` — route entry point for the planner slice (projections, retirement math, Coast FIRE live in `features/planning/`)
- `app/accounts/` — accounts route (feature code in `features/planning/` and `features/connections/`)
- `app/people/` — household members route (feature code in `features/planning/`)
- `app/goals/` — goals route (feature code in `features/goals/`)
- `app/budget/` — budget route (feature code in `features/budget/`, `features/categories/`, `features/income/`, `features/expenses/`, `features/recurring/`)
- `app/taxes/` — taxes route (feature code in `features/taxes/`)
- `app/mortgage/`, `app/debts/`, `app/retirement-income/`, `app/retirement-ladder/`, `app/tax-planning/`, `app/expenses/` — route entry points composing `features/mortgage/`, `features/debts/`, `features/retirement-access/`, `features/retirement-ladder/`, `features/taxes/`, `features/expenses/`/`features/recurring/`
- `components/ui/` — shared shadcn components
- `components/common/setup/` — setup wizard (auto-shows on first login)
- `components/common/connections/` — bank connections dialog (opens from user menu, dashboard, empty states) + Plaid Link button

---

## Architecture Patterns

### Feature Code vs. App Router

`app/` owns URL structure and route composition. Keep reusable domain code out of route folders so other routes and pure libraries do not depend on an unrelated page module. Shared domain code belongs under `features/<feature>/`; route-only components may remain beside their route (or in a private `_components/` folder), and route-only data hooks may live in a private `_hooks/` folder (for example `app/_hooks/useDashboardSummary.ts`).

A feature owns the code that changes together: GraphQL fragments and operations, generated-type aliases, form schemas and input mappers, and eventually its hooks/components. Use Codegen operation result types for API response shapes, fragment-derived types for reusable feature entities, generated schema input types for GraphQL variables, and separate form types where UI state differs from the API input. Pure functions in `lib/calc/` should accept minimal structural types such as `Pick<Expense, 'amount'>`, not depend on GraphQL-generated fragments.

Domain code lives under `features/<domain>/`; `app/` contains route entry points and route composition. The planner module is owned by `features/planning/`, while `app/future/page.tsx` is its route entry point. Shared GraphQL transport and generated documents/types remain in `lib/services/` and `lib/gql/`.

```text
features/
├── expenses/                    # transaction/expense documents, hooks, UI, and types
├── income/                      # income documents, hooks, UI, and types
├── categories/                  # category documents, hooks, UI, and types
├── budget/                      # budget operations, hooks, types, and context
├── recurring/                   # recurring operations, hooks, and expense UI
├── goals/                       # goal operations, API hook, types, logic, and UI
├── assets/                      # asset/liability operations
├── connections/                 # Plaid operations and hooks
├── debts/                       # debt payoff hook over liabilities
├── planning/                    # planner/paycheck/net-worth operations and hooks
├── mortgage/                    # mortgage calculator logic, hooks, and UI
├── retirement-access/           # conversion-ledger operations, hook, and UI
├── retirement-ladder/            # projection operation, hook, and UI
└── taxes/                       # tax operations, hooks, logic, and UI
```

### Auth Flow (Clerk, client-side)

Auth is handled via Clerk's client-side React SDK (`@clerk/clerk-react`). The app is a pure static SPA: there is no Next.js middleware (`proxy.ts`) and no `force-dynamic` — auth state lives entirely in the browser.

The authenticated user is available via the `CurrentUserProvider` context wrapper:

```typescript
// lib/providers/CurrentUserProvider.tsx
const { user, userId } = useCurrentUser();  // access anywhere in tree
```

Pages that read or write user data wrap their content in the `RequireAuth` guard
(`components/common/auth/RequireAuth.tsx`). While the signed-in user resolves it
shows a spinner; if Clerk confirms the visitor is signed out it redirects to the
homepage (the sign-in screen) and the children never mount. Public calculator
pages (`/mortgage`, `/retirement-ladder`, `/tax-planning`) skip the guard. The
nav mirrors this: routes opt into signed-out visibility with `isPublic` in
`navConfig.ts`, and both navs filter through `visibleNavItems`/`visibleNavGroups`.

```tsx
<RequireAuth>
  <AccountsContent />
</RequireAuth>
```

### Retirement Income Planner (projection engine)

Retirement withdrawal sequencing lives inside the projection engine:
`getProjection` (`breeze.web/features/planning/lib/projection.ts`) takes an optional
`withdrawalPlan` (saved HSA receipt balance + Roth conversion clocks from the
retirement-access ledger) and sequences post-retirement withdrawals in tax
order — HSA receipts, taxable, pre-tax, clocked Roth, remaining Roth —
flagging 10% penalty exposure on pre-59½ draws. Without it the drawdown stays
proportional. The plan renders on /future
(`RetirementIncomeSection`); the ledger that feeds it lives on
/retirement-income.

### Pure Domain Library (lib/calc)

Reusable financial math lives in `breeze.web/lib/calc/` — plain TypeScript, no
React, no I/O, unit-tested directly. Income definitions (`income.ts`), payroll
wage-base treatment and FICA (`payrollWages.ts`, `payrollTaxes.ts`). Components
and hooks import from it; never re-derive these figures locally. Golden
fixtures in `tests/fixtures/` (repo root) pin the federal bracket walk and
payroll tax split, shared with the Go suite so implementations can't drift.

### Memoization & React Compiler

The React Compiler is enabled (`reactCompiler` in `next.config.ts`), so components and hooks are
memoized at build time. Consequences for everyday code:

- **New code** does not need `useMemo`/`useCallback` for render performance. Derive values inline and
  define plain functions inside the component.
- **Existing memos stay.** They are correct and cheap. Delete one only when you are already editing
  that code and the value is trivially cheap.
- **Keep a memo when identity is the point**, not the computation: context provider `value` objects,
  callbacks used in effect dependency arrays, and arrays/objects handed to third-party hooks that
  compare by identity (TanStack Table columns, Recharts `data`, React Query `queryKey`).
- **Never disable a React rule.** The compiler skips any component or hook containing
  `eslint-disable(-next-line) react-hooks/...`, and the build fails on that skip
  (`panicThreshold: 'critical_errors'`). Fix the dependency array, or keep the latest value in a ref
  when an effect must run once per key — see `lib/hooks/useAutoSave.ts` and the preference flush in
  `lib/providers/CurrentUserProvider.tsx`.
- `React.memo` is unnecessary for components the compiler can compile, but still valid for ones it skips.

### Testing Hooks That Call the API

Service hooks (`features/*/hooks/`) are tested with Vitest + Testing Library by mocking
`useGraphql` and wrapping the hook in a `QueryClientProvider`. See
`features/expenses/hooks/__tests__/useTransactions.test.tsx` for the reference pattern:

- `vi.hoisted` + `vi.mock('@/lib/services/useGraphql')` — replace the transport with a `vi.fn()`
- A named `QueryWrapper` component supplies a fresh `QueryClient` (`retry: false`) per test
- Drive mutations with `act(() => result.current.someMutation.mutate(...))`, then assert the
  cache via `result.current.<data>` inside `waitFor`
- Pure math stays in `lib/__tests__` / `features/*/lib/__tests__` — hook tests are only for
  mapping, cache updates, and error semantics
- When one hook issues several documents, route the mock with `print(document)` (for example
  `if (print(doc).includes('createIncome')) …`) instead of call ordering, so tests survive
  refactors
- Provider hooks are tested by mocking `usePlannerState` / `useCurrentUser` setters and asserting
  the payload mapping; `PlannerStateProvider` itself gets a `renderHook(..., { wrapper })` test
  for defaults and the missing-provider error

### Testing UI Components

Components are tested with Testing Library and mocked boundaries rather than a full provider tree:
mock `@/features/budget/providers` (`useBudgetContext`), the entity mutation hook
(`usePostExpense`), and any dialog child that owns its own data. Then drive the real
form/dialog with `fireEvent`, assert the mutation payload, and check rendered rows inside the
table's `title` region. Keep the number of these interaction tests small: they cover wiring
(submit payloads, refetch callbacks, filters), not financial math.

`vitest.config.mts` measures `app/`, `features/`, `lib/`, and `components/`; the headline number
is depressed by UI chrome and generated GraphQL types, so judge logic coverage separately with
`--coverage.include='{features/**/lib/**,lib/calc/**,features/**/hooks/**,lib/hooks/**,features/**/providers/**}'`.
CI also runs `npm audit --omit=dev --audit-level=high` to block high-severity production
dependency advisories.

### Data Fetching (TanStack React Query)

GraphQL documents are defined in the owning feature (for example, `features/expenses/`) or in
`lib/services/queries/` for cross-cutting API slices, using the generated client's `graphql()` tag
from `lib/gql/`. Hooks wrap these typed documents in React Query. Do not pass raw query strings or
handwritten response generics to `request`.

```typescript
// lib/services/queries/assets.ts — typed documents (npm run codegen)
import { graphql } from '@/lib/gql';

export const ASSET_FIELDS = graphql(`
  fragment AssetFields on Asset { id name assetType currentValue ... }
`);

export const GET_ASSETS = graphql(`
  query GetAssets($userId: ID!) {
    assets(userId: $userId) { ...AssetFields }
  }
`);

// hooks/useAssets.ts — React Query wrapper; response type is inferred
// from the generated document, no hand-written generics needed
export function useAssets(userId: string) {
  const { request } = useGraphql();
  return useQuery({
    queryKey: ['api-assets', userId],
    queryFn: () => request(GET_ASSETS, { userId }),
    enabled: !!userId,
  });
}
```

**Codegen workflow:** operations and fragments across the web TypeScript/TSX source are validated and typed against
`breeze.api/graph/schema.graphqls`. `npm run typecheck` and `npm run build` regenerate
before checking/building; run `npm run codegen` directly when you want to refresh after a
schema or document edit. Output lives in `lib/gql/` (generated — never edit by hand).
Pass generated documents directly to `request`; TypeScript infers both variables and response data.
Use generated operation results for response-derived types and generated input types for mutation payloads,
rather than maintaining parallel DTOs. A field that no longer exists in the schema fails codegen.

**Bundle note:** the client preset's operation map (`lib/gql/gql.ts`) is not
tree-shakeable, so all document strings ship in the client bundle. At the
current app size this costs only a few KB gzipped, so we ship it as-is. The
SWC optimizer (`@swc-contrib/plugin-graphql-codegen-client-preset` +
`experimental.swcPlugins`) is the documented fix, but we measured negligible
savings on Next 16/Turbopack — revisit if the document count grows enough to
matter.

**Stable query key convention:** `['api-<slice>', userId]` — always include the user ID.

### Mutation Pattern

```typescript
export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { request } = useGraphql();
  return useMutation({
    mutationFn: (input: CreateAssetInput) => request(CREATE_ASSET, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-assets'] });
    },
  });
}
```

### Monorepo Layout

```
breeze.web/
├── app/                    # Next.js routes and route composition
│   ├── budget/             # Budget route and layout
│   ├── future/             # /future route entry point
│   ├── layout.tsx          # Root layout with Clerk + CurrentUserProvider
│   └── page.tsx            # Dashboard
├── features/               # Reusable domain features, independent of route ownership
│   ├── expenses/           # Expense/transaction documents, hooks, and UI
│   ├── income/              # Income documents, types, hooks, and UI
│   ├── categories/          # Category documents, types, hooks, and UI
│   ├── budget/              # Budget documents, hooks, types, and context
│   ├── recurring/           # Recurring documents, hooks, and UI
│   ├── goals/               # Goal documents, API hook, types, logic, and UI
│   ├── assets/              # Asset/liability operations
│   ├── connections/         # Plaid operations/hooks
│   ├── debts/               # Debt payoff hook over liabilities
│   ├── planning/            # Planner UI, state, types, calculations, hooks, and operations
│   ├── mortgage/            # Mortgage calculations, hooks, and UI
│   ├── retirement-access/   # Retirement-access operations/hook/UI
│   ├── retirement-ladder/   # Retirement-ladder operation/hook/UI
│   └── taxes/               # Tax operations, hooks, logic, and UI
├── components/             # Shared UI components (shadcn)
│   └── ui/
├── lib/
│   ├── calc/               # Pure, framework-free financial calculations
│   ├── gql/                # Generated GraphQL documents and types (never edit by hand)
│   ├── hooks/              # Shared hooks
│   └── services/           # Shared GraphQL transport (useGraphql)
└── package.json
```

---

## Key Types

Account and liability types are defined in `features/planning/types/account.ts`:

```typescript
export type AccountType =
  | 'checking' | 'emergency-fund' | 'brokerage'
  | '401k' | '403b' | '457' | 'roth-ira' | 'traditional-ira' | 'hsa'
  | 'home' | 'vehicle'
  | 'student-loan' | 'credit-card' | 'personal-loan' | 'auto-loan' | 'mortgage'
  | 'other';

export type ContributionMode = 'monthly' | 'yearly' | 'salary-percent';
export type AccountOwner = 'self' | 'spouse';
```

Type mapping between frontend `AccountType` and API `ApiAssetType`/`ApiLiabilityType` lives in:
`features/planning/lib/typeMapping.ts`

---

## GraphQL Conventions on the Wire

- All monetary amounts are `String` (not `Float`) — avoids floating point precision loss
- Parse on client: `parseFloat(category.totalSpent)` or use a formatting utility
- Nullable fields have no `!` — non-nullable fields have `!`
- All IDs are `ID!` (non-null ID type)

---

## Key shadcn Components in Use

| Component | Used For |
|---|---|
| `Select` | Account type, owner, contribution mode dropdowns |
| `Input` | Name, balance, rate fields |
| `Card` | Account cards, budget overview, net worth summary |
| `Button` | Add/delete/save actions |
| `Badge` | Account type labels, tags |
| `Chart` (Recharts) | Net worth history, account projections |
| `Dialog` | Add account, confirm delete |
| `Progress` | Category spending, FI number progress |

---

## UI Patterns for This Codebase

- **Client components**: All planner components are `'use client'` — they manage form state and React Query hooks
- **Form state**: Kept local to the component via `useState` or React Hook Form, saved on blur or explicit save button
- **Owner pattern**: Accounts have an `owner` field (`self` / `spouse`) with people reference for age calculations
- **Contribution mode**: Controls how contribution values are interpreted — monthly, yearly, or salary-percent

---

## Deployment

Next.js is configured with `output: 'export'` and builds to `out/` via `npm run build`. The result is a fully static site that can be hosted on any static file server (nginx, Vercel, Cloudflare Pages, S3, etc.).

```bash
npm run build    # produces out/ (static export)
```
