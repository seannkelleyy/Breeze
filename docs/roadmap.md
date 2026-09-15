# Roadmap

## Deployment

- [ ] Deploy API to Render
- [ ] Deploy frontend to Vercel/Render
- [ ] Set up production PostgreSQL on Render
- [ ] Configure Clerk production environment
- [ ] Configure Plaid production environment

## CI Cleanup

- [ ] Update `docs/deployment/01-hosting.md` to reflect Render deployment

## Dashboard

- [ ] Add net worth history chart (past to present) — line chart showing net worth over time

## Product (from vision)

1. Balance sheet — assets, liabilities, net worth over time
2. Budget — monthly envelope budgeting, categories, expense splits
3. Account projections — retirement account growth, IRS limits, IsMaxing
4. Retirement scenarios — FI number, FIRE progress, what-if modeling
5. Plaid integration — auto-sync transactions
6. Tax planning — form checklist, estimate
7. Roth ladder + HSA ladder — advanced FIRE features


## Sean's notices
1. ~~On iphone, the area around the search bar and top bar is white instead of black.~~ (fixed — added `apple-mobile-web-app-status-bar-style` metadata)
2. ~~I created some accounts while signed in with clerk via github. then my wife created an account via clerk and apple and she saw my accounts. This is in hosted env.~~ (fixed — all resolvers now enforce authenticated userId via `resolveUserIDFromCtx`)
