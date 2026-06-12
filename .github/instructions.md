# Breeze API — Development Instructions

## Backwards Compatibility
- This is a pre-production codebase. No need to maintain backward compatibility with old schema values or API contracts.
- Breaking changes to enums, types, and schemas are acceptable.

## Asset Type System (as of 2025-06-11)
- `asset_type` enum in PostgreSQL and GraphQL uses granular types matching the frontend `AccountType`:
  `CHECKING`, `EMERGENCY_FUND`, `BROKERAGE`, `_401K`, `_403B`, `_457`, `ROTH_IRA`, `TRADITIONAL_IRA`, `HSA`, `HOME`, `VEHICLE`, `OTHER`
- Numeric-prefixed enum values use underscore prefix (`_401K`, `_403B`, `_457`) since PostgreSQL/GraphQL enums can't start with digits.
- Liability types (`STUDENT_LOAN`, `CREDIT_CARD`, etc.) live in the separate `liability_type` enum.
- Frontend type mapping: `breeze.web/app/planner/lib/typeMapping.ts` handles `AccountType <-> ApiAssetType` translation.

## Code Generation
- `make gen` generates sqlc Go code from SQL queries + migrations, then gqlgen code from the GraphQL schema.
- sqlc reads the migration directory as its schema source (`sqlc.yaml` → `schema: "./db/migrations"`).
- Generated files are in `internal/db/sqlc/` (sqlc) and `graph/model/` + `graph/generated/` (gqlgen).

## Schema Management (Atlas)
- `atlas migrate diff <name> --env local` generates new migration SQL from `schema.hcl`.
- `atlas migrate hash --env local` updates the `atlas.sum` checksum file after manual migration changes.
- PostgreSQL enum value additions cannot be done via `ALTER TYPE ... ADD VALUE` in a migration because Atlas can't reorder values.
  For enum changes, use the RENAME + CREATE NEW + MIGRATE + DROP OLD pattern (see migration `20260611214200_extend_asset_type_enum.sql`).