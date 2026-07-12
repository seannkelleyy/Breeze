# 02 — Product & Business Model

## Pricing Tiers

| Tier | Price | Notes |
|---|---|---|
| Self-hosted | Free forever | MIT licensed. Users manage their own server and Postgres. Plaid dev credentials required (free up to 100 items). |
| Cloud hosted | $5-6/month or $50/year | Managed hosting, Plaid included, automatic updates. |
| Lifetime | $150 one-time | Early adopter offer. Generates upfront cash while building. Switch to subscription-only once proven. |

---

## Unit Economics

### Infrastructure costs

| Component | Cost |
|---|---|
| Hetzner CAX11 (API + static frontend) | €4.51/month |
| Neon free tier (Postgres) | $0 |
| Plaid production (~2 institutions/user) | ~$0.80/user/month |
| Stripe fees | ~2.9% + $0.30/transaction |

### Revenue scenarios

| Users | Revenue | Infra + Plaid | Profit |
|---|---|---|---|
| 50 paying | $300/month | ~$90 | ~$210/month |
| 100 paying | $600/month | ~$130 | ~$470/month |
| 500 paying | $3,000/month | ~$450 | ~$2,550/month |
| 1,000 paying | $6,000/month | ~$850 | ~$5,150/month |

At 100 users you're meaningfully profitable. YNAB needs tens of thousands of users before their economics work. Your break-even is under 30 paying users.

### The solo dev cost advantage

No salaries. No office. No benefits. Your marginal cost of serving one more user is essentially the Plaid fee (~$0.80) plus a fraction of a cent of compute. This is structurally impossible for a VC-backed company to match.

---

## Competitive Landscape

| App | Price | Self-hosted | FIRE tools | Budget | Verdict |
|---|---|---|---|---|---|
| YNAB | $109/year | No | No | Yes | Strong budget, no planning |
| Monarch | $99/year | No | Basic | Yes | Good but pricey SaaS |
| Copilot | $100/year | No | No | Yes | iOS-only, limited |
| ProjectionLab | $120/year | No | Yes | No | Great scenarios, no budget |
| Empower | Free | No | Partial | No | Ad-supported, data harvested |
| **This app** | **$50-60/year** | **Yes** | **Yes** | **Yes** | **No direct competitor** |

---

## Go-to-Market Strategy

### Phase 1 — Build for yourself (now)
- Build it for your own use first
- Make it genuinely excellent before showing anyone
- Start with the balance sheet and net worth tracking — most visually impressive

### Phase 2 — Self-hosted launch (when MVP is solid)
- Post to **r/selfhosted** — community actively looks for exactly this
- Post to **r/financialindependence** — FIRE tools resonate deeply here
- **Hacker News Show HN** — developer-focused, self-hosting angle gets upvoted
- Write a technical blog post about the architecture (Atlas, sqlc, gqlgen pipeline)

### Phase 3 — Broader reach
- Post to **r/personalfinance** — broader audience
- Build in public on Twitter/X — post about progress, architecture decisions, milestones
- Target the "burned by Mint shutting down" and "YNAB price increase" audiences explicitly

### Rules
- Do not think about monetization until 50-100 people are actively using it
- Early users will reshape the product more than any upfront planning
- The self-hosted free tier is marketing — every blog post and r/selfhosted recommendation is free distribution

---

## Self-Hosted as a Moat

The big players **structurally cannot offer self-hosting**. YNAB's business model requires all data on their servers. Monarch's valuation requires control of user data. You have no such constraint.

Every privacy-conscious developer who self-hosts and loves the app becomes a marketer. They write blog posts ("How I set up my personal finance planner on Hetzner for $5/month"), post on r/selfhosted, and recommend it to friends. You cannot buy this word of mouth.

---

## Legal Disclaimers Required

Two features require prominent disclaimers in the UI:

**Tax Planning:**
> "This is an estimate for informational purposes only and does not constitute tax advice. Consult a qualified tax professional before filing."

**SEPP / Rule 72(t):**
> "SEPP calculations carry real tax and penalty consequences if executed incorrectly. Always consult a qualified financial advisor before starting a SEPP distribution."

These should appear on the relevant screens in the UI, in the onboarding flow for those features, and in the Terms of Service. This is not optional.
