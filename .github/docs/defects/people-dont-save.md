# Defect: People Data Not Persisted to Backend

## Status
Resolved

## Root Cause
No `PlannerPerson` type existed in the backend GraphQL schema, no database table, no service layer, and no frontend mutations for persisting planner people data.

## Fixes Applied

### Backend
1. **Database Migration** (`db/migrations/20260709000000_planner_people.sql`): Created `planner_people` table with user FK, person fields, and soft-delete support.
2. **SQLC Queries** (`db/queries/planner_people.sql`): Upsert, list by user, and soft-delete queries.
3. **Service Layer** (`internal/service/planner_person.go`): `PlannerPersonService` with Upsert, ListByUserID, Delete, and DeleteByUserID methods.
4. **GraphQL Schema** (`graph/schema.graphqls`): Added `PlannerPerson` type, `UpsertPlannerPersonInput`, `plannerPeople` query, `upsertPlannerPerson` and `deletePlannerPerson` mutations.
5. **GraphQL Helpers** (`graph/planner_person_helpers.go`): Input/output mappers with decimal string parsing.
6. **Resolver** (`graph/resolver.go`): Added `PlannerPersonService` field.
7. **Resolvers** (`graph/schema.resolvers.go`): Implemented query + mutation resolvers with auth context resolution.
8. **Main** (`cmd/api/main.go`): Wired `PlannerPersonService` into the resolver.

### Frontend
1. **GraphQL Queries** (`lib/services/queries/plannerPeople.ts`): `UPSERT_PLANNER_PERSON`, `DELETE_PLANNER_PERSON`, `GET_PLANNER_PEOPLE` definitions.
2. **Mutation Hook** (`app/planner/hooks/planner/usePersonMutations.ts`): `usePersonMutations` hook with upsert and delete mutations, following the `useAccountMutations` pattern.
3. **PeopleCard** (`app/planner/components/PeopleCard.tsx`): "Save People" button now calls `upsertPersonMutation.mutateAsync` for each person via `Promise.all`.
4. **Data Loading** (`app/planner/hooks/planner/useFetchPlanner.ts`): Extended to fetch `plannerPeople` from the API and map them to `PlannerPerson` objects.
5. **Page Hydration** (`app/planner/page.tsx`): Extended the data-loading effect to hydrate `plannerPeople` from fetched data.

### Applying Changes
Run `make dev` in `Breeze.Api/` — it starts postgres, applies migrations with Atlas, regenerates sqlc/gqlgen code, and starts the API server.

```bash
cd Breeze.Api && make dev
``` 