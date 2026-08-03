# Roadmap

## Deployment (Hetzner CAX11)

- [ ] Regenerate GitHub OAuth secret (old one exposed in chat)
- [ ] Set `WOODPECKER_AGENT_SECRET` to a real value in `.env.woodpecker`
- [ ] Update `WOODPECKER_HOST` in `compose.woodpecker.yaml` to VPS public URL
- [ ] Add deploy step to `.woodpecker.yml` (SSH to VPS, pull, restart)
- [ ] Write production `docker-compose.yml` (postgres + breeze-api + woodpecker + nginx)
- [ ] Set up nginx config for static frontend (`out/`) + API reverse proxy
- [ ] TLS with certbot
- [ ] Update `docs/deployment/01-hosting.md` (stale — references GitHub Actions, old project names)

## CI Cleanup

- [ ] Update `docs/deployment/01-hosting.md` CI/CD section to reference Woodpecker instead of GitHub Actions
- [ ] Remove Pulumi/IaC section from hosting doc (not using it)

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
