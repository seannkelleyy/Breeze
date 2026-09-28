# Production Checklist

## Auth (Clerk)
- Dev instance (`pk_test_*`/`sk_test_*`) is in use. Create a production instance, then set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (web) and `CLERK_SECRET_KEY` (api) to the prod values. Configure the prod allowed origins (web + api URLs) in Clerk.

## Plaid
- `PLAID_ENV` is `sandbox`; production requires Plaid approval → set `production` + production credentials. Link flow, account sync, and the hourly transaction river worker all use the same client.

## Logging
- `slog` default handler is text; for Render log drains swap to `slog.NewJSONHandler` in the logger middleware + main. Access-log and panic-recovery middleware are already mounted.

## Database
- Migrations apply via `make migrate-deploy` (atlas); reference data via `go run ./cmd/seed` in the build command. Backups: enable Render PITR.

## Security

Credential-exposure audit (2026-09-28, full git-history forensics — repo is **public**):

| Credential | In public history? | Action |
|---|---|---|
| Plaid `PLAID_SECRET` / `PLAID_CLIENT_ID` (current) | **No** — never committed | None required |
| Render DB password | No (chat-only exposure) | Rotate: Render dashboard → database → reset password → update `DATABASE_URL` env var on the api service → redeploy |
| Clerk **test** secret key (`sk_test_*`) | **Yes** — .NET-era `Breeze.Web/.env` (removed mid-2026, retained in history) | Rotate in the Clerk **dev instance**: dashboard → API keys → roll secret. The `pk_test_*` publishable key is public by design — no action |
| Azure SQL admin password (`breezeadmin`, .NET-era `appsettings.json`) | **Yes** | Old stack — delete the `breeze-sql` / `breeze-sql-server` Azure resources if they still exist, otherwise rotate |
| Localhost `DATABASE_URL` (commit 048ed82) | Yes | Harmless — local dev only |

Before real users: create the Clerk production instance and get Plaid production approval (sections above). Test/dev credentials grant no access to production.

Optional hardening: squash public history to drop the pre-Go (.NET) era entirely — viable pre-production with a single developer, but rotation alone already closes every live exposure.

- `ALLOWED_ORIGIN` on the API must exactly match the web URL.
