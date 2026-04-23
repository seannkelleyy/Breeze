# UI Slice API Checklist

Use this checklist when adding a new backend API slice to breeze.web.

Goal:

- Keep API access patterns consistent.
- Keep domain hooks focused on one domain.
- Reuse auth/user bootstrap logic across slices.

## Architecture Pattern

1. Shared transport layer
- Use lib/services/useHttp.ts for authenticated HTTP transport.
- Use lib/services/useGraphql.ts for GraphQL request/response handling.

2. Shared API-user bootstrap
- Use lib/services/useApiUserBootstrap.ts to resolve/create backend user.
- Do not duplicate createUser/me bootstrap logic inside domain hooks.

3. Domain API service hook
- Create app/<module>/hooks/<slice>/use<Slice>Api.ts.
- Keep only slice operations in this file (queries/mutations for that slice).

4. React Query hooks
- Add useFetch<Slice>.ts, useCreate<Slice>.ts, useUpdate<Slice>.ts, useDelete<Slice>.ts.
- Use stable query keys like ['api-<slice>', userId].
- Invalidate that key on successful mutations.

5. Domain types
- Add API wire types in app/<module>/types/<slice>.ts.
- Keep money/rate fields as string in API types.

6. UI integration
- Add a focused card/page component for the slice.
- Keep form state local to the component.
- Show loading/error status from query and mutation hooks.

## Implementation Checklist

- [ ] Confirm backend GraphQL operations exist and are reachable via POST /query
- [ ] Add or reuse types in app/<module>/types/<slice>.ts
- [ ] Add/extend use<Slice>Api.ts with slice-only operations
- [ ] Add fetch hook with useQuery and stable queryKey
- [ ] Add mutation hooks with useMutation and query invalidation
- [ ] Resolve backend user via useApiUserBootstrap where user_id is required
- [ ] Add UI component for list/create/update/delete flow
- [ ] Gate behavior for signed-out state
- [ ] Validate decimal string input formatting before mutation calls
- [ ] Add optimistic or refetch behavior after mutation
- [ ] Add user-friendly error surface in UI
- [ ] Run npm run build and resolve all type/build errors

## Naming Conventions

- use<Slice>Api.ts: domain API service
- useFetch<Slice>.ts: read/list query hook
- useCreate<Slice>.ts: create mutation hook
- useUpdate<Slice>.ts: update mutation hook
- useDelete<Slice>.ts: delete mutation hook
- api<slice>.ts or <slice>.ts in types: wire contracts

## Example (Assets)

Reference implementation:

- app/planner/hooks/assets/useAssetsApi.ts
- app/planner/hooks/assets/useApiUser.ts
- app/planner/hooks/assets/useFetchAssets.ts
- app/planner/hooks/assets/useCreateAsset.ts
- app/planner/hooks/assets/useUpdateAsset.ts
- app/planner/hooks/assets/useDeleteAsset.ts
- app/planner/components/ApiAssetsCard.tsx
- lib/services/useGraphql.ts
- lib/services/useApiUserBootstrap.ts

## Common Pitfalls

- Mixing API-user bootstrap into each domain hook.
- Querying all users client-side when me is sufficient.
- Using numbers for money/rates instead of strings over API.
- Forgetting query invalidation after create/update/delete.
- Coupling component UI state directly to transport layer internals.
