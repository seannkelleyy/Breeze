# 01 — Frontend (Web App)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 + React 19 | App Router, server/client components |
| UI components | shadcn/ui + Radix + Tailwind v4 | Owned in repo, not node_modules |
| Data fetching | TanStack React Query v5 | Stable cache keys, mutations, invalidation |
| HTTP client | Axios | Direct HTTP calls to GraphQL endpoint |
| Auth | Clerk (`@clerk/nextjs`) | Clerk middleware, proxy.ts, CurrentUserProvider |
| Forms | React Hook Form + Zod | Pairs with shadcn form components |
| Charts | Recharts | Works with Tailwind, included in shadcn chart |
| Package manager | npm | |

---

## Architecture Patterns

### Auth Flow (Clerk + Middleware)

Auth is handled via Clerk's Next.js SDK. The middleware in `proxy.ts` protects API routes:

```typescript
// proxy.ts — Clerk middleware
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
```

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
├── proxy.ts                # Clerk middleware
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

Next.js builds to `.next/` via `npm run build`. Deployed as part of the monorepo.

```bash
npm run build    # production build
npm run start    # production server (Node required)
```
