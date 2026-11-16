# UI Slice API Checklist

Use this checklist when adding a new backend API slice to breeze.web.

Goal:

- Keep API access patterns consistent.
- Keep domain hooks focused on one domain.
- Reuse auth/user bootstrap logic across slices.

## Architecture Pattern

1. Shared transport layer
- Use lib/services/useGraphql.ts for authenticated GraphQL transport and request/response handling.

2. Shared API-user bootstrap
- Use `lib/providers/CurrentUserProvider.tsx` as the source of authenticated user context.
- Do not duplicate user bootstrap logic inside domain hooks.

3. Domain API service hook
- Create features/<domain>/hooks/use<Domain>Api.ts.
- Keep only domain operations in this file (queries/mutations for that domain).

4. React Query hooks
- Add useFetch<Domain>.ts, useCreate<Domain>.ts, useUpdate<Domain>.ts, useDelete<Domain>.ts.
- Use stable query keys like ['api-<domain>', userId].
- Invalidate that key on successful mutations.

5. Domain types
- Add API wire types in features/<domain>/types.ts.
- Keep money/rate fields as string in API types.

6. UI integration
- Add a focused card/page component for the slice.
- Keep form state local to the component.
- Show loading/error status from query and mutation hooks.

## Implementation Checklist

- [ ] Confirm backend GraphQL operations exist and are reachable via POST /query
- [ ] Add or reuse types in features/<domain>/types.ts
- [ ] Add/extend use<Slice>Api.ts with slice-only operations
- [ ] Add fetch hook with useQuery and stable queryKey
- [ ] Add mutation hooks with useMutation and query invalidation
- [ ] Resolve authenticated user context via CurrentUserProvider where user_id is required
- [ ] Add UI component for list/create/update/delete flow
- [ ] Gate behavior for signed-out state
- [ ] Validate decimal string input formatting before mutation calls
- [ ] Add optimistic or refetch behavior after mutation
- [ ] Add user-friendly error surface in UI
- [ ] Run npm run build and resolve all type/build errors

## Naming Conventions

- use<Domain>Api.ts: domain API service
- useFetch<Domain>.ts: read/list query hook
- useCreate<Domain>.ts: create mutation hook
- useUpdate<Domain>.ts: update mutation hook
- useDelete<Domain>.ts: delete mutation hook
- <domain>.operations.ts / <domain>.queries.ts / <domain>.mutations.ts: GraphQL documents
- types.ts in features/<domain>: wire contracts

## Example (Planning)

Reference implementation:

- features/planning/hooks/planner/useFetchPlanner.ts
- features/planning/hooks/planner/usePlannerAccounts.ts
- features/planning/hooks/planner/useAccountMutations.ts
- features/planning/components/AccountsCard.tsx
- lib/services/useGraphql.ts
- lib/providers/CurrentUserProvider.tsx

## Common Pitfalls

- Mixing user bootstrap into each domain hook instead of using CurrentUserProvider.
- Querying all users client-side when me is sufficient.
- Using numbers for money/rates instead of strings over API.
- Forgetting query invalidation after create/update/delete.
- Coupling component UI state directly to transport layer internals.
