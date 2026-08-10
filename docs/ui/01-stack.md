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
npm run gen        # GraphQL codegen
npm run test       # Vitest
```

### Module Entry Points

- `app/future/` — financial projections, retirement math, Coast FIRE (renamed from planner)
- `app/accounts/` — financial accounts management
- `app/people/` — household members
- `app/goals/` — financial goals and Financial Order of Operations checklist
- `app/preferences/` — user settings and defaults
- `app/budget/` — budgeting workflow and dialogs
- `app/plaid-connections/` — Plaid connect/sync UI
- `components/ui/` — shared shadcn components
- `components/common/setup/` — setup wizard (auto-shows on first login)

---

## Architecture Patterns

### Auth Flow (Clerk, client-side)

Auth is handled via Clerk's client-side React SDK (`@clerk/clerk-react`). The app is a pure static SPA: there is no Next.js middleware (`proxy.ts`) and no `force-dynamic` — auth state lives entirely in the browser.

The authenticated user is available via the `CurrentUserProvider` context wrapper:

```typescript
// lib/providers/CurrentUserProvider.tsx
const { user, userId } = useCurrentUser();  // access anywhere in tree
```

### Data Fetching (TanStack React Query)

GraphQL queries are defined as string constants and called via Axios, then wrapped in React Query hooks:

```typescript
// lib/services/queries/assets.ts — query definitions
export const GET_ASSETS = `
  query GetAssets($userId: ID!) {
    assets(userId: $userId) {
      id
      name
      assetType
      currentValue
      ...
    }
  }
`;

// hooks/useAssets.ts — React Query wrapper
export function useAssets(userId: string) {
  return useQuery({
    queryKey: ['api-assets', userId],
    queryFn: () => request(GET_ASSETS, { userId }),
    enabled: !!userId,
  });
}
```

**Stable query key convention:** `['api-<slice>', userId]` — always include the user ID.

### Mutation Pattern

```typescript
export function useCreateAsset() {
  const queryClient = useQueryClient();
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
├── app/                    # Next.js App Router pages
│   ├── planner/            # Planner module (accounts, projections, etc.)
│   │   ├── components/     # Planner-specific components
│   │   ├── hooks/          # Domain-specific hooks
│   │   ├── lib/            # Planner math, config, constants, type mapping
│   │   ├── services/       # API service calls
│   │   └── types/          # Planner domain types
│   ├── layout.tsx          # Root layout with Clerk + CurrentUserProvider
│   └── page.tsx            # Home page (redirects to planner)
├── components/             # Shared UI components (shadcn)
│   └── ui/                 # Button, Card, Input, Select, etc.
├── lib/
│   ├── providers/          # Context providers (CurrentUserProvider)
│   └── services/           # Shared transport (useGraphql.ts, useHttp.ts)
└── package.json
```

---

## Key Types

Account and liability types are defined in `app/planner/types/account.ts`:

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

Type mapping between frontend `AccountType` and API `ApiAssetType` lives in:
`app/planner/lib/typeMapping.ts`

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
