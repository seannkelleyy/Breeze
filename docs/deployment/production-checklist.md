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
- Rotate the DB password and Plaid secret (both appeared in git history / chat).
- `ALLOWED_ORIGIN` on the API must exactly match the web URL.
