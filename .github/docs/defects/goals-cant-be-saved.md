# Defect: Goals Cannot Be Saved (FK Constraint Violation)

## Status
Resolved

## Root Cause
The `CreateGoal` resolver sent the client-provided `userId` directly to the service layer. The client was sending a UUID that didn't match the internal user ID in the database, causing the foreign key constraint `fk_goals_user` to fail.

## Fix
Added `resolveUserIDFromCtx` in `graph/resolver.go` that extracts the authenticated user's internal UUID from the request context by looking up the Clerk identity provider ID. The `CreateGoal` resolver in `graph/schema.resolvers.go` now overrides `input.UserID` with the resolved authenticated user ID before calling the service layer.

### Affected Files
- `Breeze.Api/graph/resolver.go`: Added `resolveUserIDFromCtx` helper function
- `Breeze.Api/graph/schema.resolvers.go`: `CreateGoal` now resolves user from auth context and overrides userId
- `Breeze.Web/components/common/form/BreezeFormDialog.tsx`: Made `handleSubmit` async with error catching and display
- `Breeze.Web/app/budget/components/expense/dialogs/CreateExpenseDialog.tsx`: Made `onSubmit` async using `mutateAsync`
- `Breeze.Web/app/budget/components/expense/dialogs/EditExpenseDialog.tsx`: Made `onSubmit` async using `mutateAsync`"