# UI Slice API Checklist

Use this checklist when adding a new backend API slice to breeze.web.

Goal:

- Keep API access patterns consistent.
- Keep domain hooks focused on one domain.
- Reuse auth/user bootstrap logic across slices.

## Architecture Pattern

1. Feature-owned GraphQL operations
- Put typed GraphQL documents beside the feature that owns them (for example, `features/assets/asset.operations.ts`).
- Use the generated `graphql()` tag from `lib/gql/`; do not maintain raw query strings or handwritten response generics.

2. Shared authenticated transport and user context
- Send requests through `lib/services/useGraphql.ts` from hooks.
- Use `lib/providers/CurrentUserProvider.tsx` for the current user; do not duplicate user bootstrap.
- The server derives the caller from authenticated transport. Pass `userId` as a GraphQL variable only if an operation explicitly needs it for resource selection, not to identify the signed-in caller.

3. Domain hooks as the data boundary
- Keep queries, mutations, cache updates, and invalidation in feature hooks.
- Components use domain hooks or receive data and callbacks through props; they do not import GraphQL documents or call `useGraphql()` directly.
- A separate API wrapper hook is optional: use it when it meaningfully centralizes domain operations, not as a required file per slice.

4. Query and mutation cache behavior
- Use stable domain-first query keys. Include `userId` for user-owned data, followed by resource IDs and filters as needed (for example, `['goals', userId]` or `['budget', userId, month]`).
- Gate user-owned queries until the current user is available.
- Mutations invalidate every affected cache key on success; scope invalidation to the active user's key when appropriate.

5. Domain types and UI
- Keep money/rate fields as strings at the GraphQL boundary.
- Keep form/interaction state in components and query/mutation state in hooks.
- Surface loading, error, and pending states from the hooks.

## Implementation Checklist

- [ ] Confirm backend GraphQL operations exist and are reachable via POST /query
- [ ] Add or reuse types in features/<domain>/types.ts
- [ ] Add/extend typed GraphQL documents in the owning feature
- [ ] Add a domain hook for reads with a stable, user-scoped query key and signed-out gate
- [ ] Add mutation hooks with success invalidation for all affected query keys
- [ ] Use CurrentUserProvider for current-user identity; do not pass it as a GraphQL variable unless the operation requires it
- [ ] Keep components on the hook/props boundary rather than calling the transport directly
- [ ] Add UI component for list/create/update/delete flow
- [ ] Gate behavior for signed-out state
- [ ] Validate decimal string input formatting before mutation calls
- [ ] Add optimistic or refetch behavior after mutation
- [ ] Add user-friendly error surface in UI
- [ ] Run npm run build and resolve all type/build errors

## Organization

Follow the owning feature's established naming and grouping. Keep operation documents in the feature
folder; group related reads and mutations into focused hooks. Do not create a pass-through API hook
or one hook file per CRUD operation unless that split clarifies the domain boundary.

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
