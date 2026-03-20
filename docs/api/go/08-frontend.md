# 08 — Frontend

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast, simple, produces static files — no Node process to manage |
| Framework | React | |
| UI components | shadcn/ui + Tailwind | You own the component code — lives in your repo, not node_modules |
| Base primitives | Radix UI | Most mature, largest community, most Stack Overflow answers |
| GraphQL client | urql | Lighter than Apollo, less config for a solo dev |
| Type generation | graphql-codegen | TypeScript types + React hooks generated from Go schema |
| Charts | Recharts | Works cleanly with Tailwind, included in shadcn chart component |
| Forms | React Hook Form + Zod | Pairs well with shadcn form components |
| Auth | Clerk React SDK | Same Clerk used on backend — drop-in |
| Routing | React Router v7 | |

---

## graphql-codegen — The Key Integration

Write a query in a `.graphql` file, run codegen, get a fully typed React hook. This is the closest thing to end-to-end type safety outside of tRPC.

```graphql
# src/queries/budget.graphql
query GetBudget($id: ID!) {
  budget(id: $id) {
    id
    date
    totalIncome
    totalSpent
    surplus
    categories {
      id
      description
      effectiveAllocation
      totalSpent
      remaining
      percentUsed
    }
  }
}
```

Generates `useGetBudgetQuery()` — fully typed, no manual fetch code, no manual type definitions.

```bash
# After any backend schema change:
make gen           # regenerates Go types (sqlc + gqlgen)
npm run codegen    # regenerates TypeScript types + React hooks

# The TypeScript compiler then tells you everywhere the UI needs updating
```

---

## GraphQL Conventions on the Wire

- All IDs are `String` (not `ID` type) to avoid serialization issues
- All monetary amounts are `String` (not `Float`) — avoids floating point precision loss
- Parse on the client: `parseFloat(category.totalSpent)` or use a decimal library
- Nullable fields have no `!` — non-nullable fields have `!`

---

## Hosting — Static Files Only

Vite builds a `dist/` folder of static HTML, CSS, and JS. No Node process. Served directly from nginx:

```nginx
server {
    listen 443 ssl;
    server_name app.yourdomain.com;

    root /var/www/budget-app/dist;
    try_files $uri $uri/ /index.html;  # SPA routing

    location /graphql {
        proxy_pass http://localhost:8080;  # Go API
    }
}
```

Deploy:

```bash
npm run build
scp -r dist/* user@yourserver.com:/var/www/budget-app/dist/
```

---

## Scalability Path

Vite + static files scales without code changes:

1. **Now** — nginx serves `dist/` on the same Hetzner server as the Go API (~$5/month total)
2. **If traffic grows** — Cloudflare free CDN in front of nginx (config change, zero code change)
3. **If much larger** — S3 + CloudFront for static files (config change, zero code change)
4. **If SEO ever matters** — Next.js migration (manageable rewrite, components stay the same)

The bottleneck at any realistic scale is the Go API and Postgres — never static file serving.

---

## Why Not Next.js

- Every route requires login — no SEO benefit
- No public landing pages that need server rendering
- No open graph previews for budget data
- Adding server components introduces complexity with zero benefit for an auth-gated app
- Migration from Vite to Next.js is possible later (one weekend, mostly mechanical) if requirements change

---

## Key shadcn Components for This App

| Component | Used For |
|---|---|
| `DataTable` (TanStack Table) | Expense lists — sortable, filterable, expandable split rows |
| `Chart` (Recharts) | Net worth history, budget allocation, account projections |
| `Command` | Tag selection, category picker |
| `Dialog` | Add expense, add account, scenario comparison |
| `Form` (React Hook Form) | All data entry forms |
| `Card` | Budget overview, net worth summary, FI progress |
| `Progress` | Category spending, FI number progress |
| `Badge` | Tags on expenses, account types |

---

## Monorepo Structure (if keeping API and web together)

```
budget/
├── api/          # Go API (go.mod)
└── web/          # Vite + React
    ├── src/
    │   ├── queries/    # .graphql files — codegen input
    │   ├── components/
    │   │   └── ui/     # shadcn components — you own these
    │   ├── pages/
    │   └── lib/
    ├── codegen.ts
    └── package.json
```

Shared `Makefile` at root:

```makefile
gen:
    cd api && make gen
    cd web && npm run codegen
```

One command keeps both sides in sync after any schema change.
