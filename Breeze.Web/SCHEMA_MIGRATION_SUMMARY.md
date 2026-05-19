# Budget Directory Schema Migration Summary

## Overview

The entire `app/budget` directory has been updated to work with the GraphQL backend schema. This includes:

1. **Type Definitions** - Updated to match GraphQL schema with string IDs and Decimal amounts
2. **GraphQL Hooks** - Updated to use string IDs and handle new data structures
3. **Testing Infrastructure** - Jest and React Testing Library setup
4. **Documentation** - Comprehensive guides for ongoing updates

## Files Modified

### Type Definitions (✅ COMPLETED)
- `types/budget.ts` - Budget type with string IDs and Decimal amounts
- `types/income.ts` - Income type with simplified schema
- `types/expense.ts` - Expense type with splits support
- `types/category.ts` - Category type simplified

### GraphQL Hooks (✅ COMPLETED)
- `hooks/income/useIncomes.ts` - Updated for string IDs and Decimal amounts
- `hooks/expense/useExpenses.ts` - Updated with expense splits support
- `hooks/category/useCategories.ts` - Updated for string IDs
- `hooks/recurring/recurringTemplateServices.ts` - Completely rewritten to use GraphQL

### Testing Infrastructure (✅ COMPLETED)
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test environment setup
- `__tests__/test-utils.tsx` - Custom render functions
- `__tests__/hooks/useIncomes.test.ts` - Example test file
- `TESTING.md` - Testing documentation

### Documentation (✅ COMPLETED)
- `README.md` - Overview of budget directory changes
- `DIALOG_UPDATE_GUIDE.md` - Detailed guide for updating dialogs
- `TESTING.md` - Testing setup and best practices

## Key Type Changes

### IDs: `number` → `string`
All database IDs are now strings (UUIDs):
```typescript
// Before
id: number = 123

// After
id: string = '550e8400-e29b-41d4-a716-446655440000'
```

### Amounts: `number` → `string`
All monetary values are now strings (Decimal type):
```typescript
// Before
amount: number = 100.50

// After
amount: string = '100.50'
```

### enums: Lowercase → UPPERCASE
All enum values are now UPPERCASE to match GraphQL:
```typescript
// Before
sourceType: 'manual' | 'recurring-template'

// After
sourceType: 'MANUAL' | 'RECURRING_TEMPLATE'
```

## GraphQL Queries & Mutations

All CRUD operations are fully defined in `/lib/services/queries/budget.ts`:

### Budget
- `budgetByDate(userId, date)` - Get budget for a month
- `createBudget(input)` - Create new budget
- `updateBudget(input)` - Update budget amounts
- `deleteBudget(id)` - Delete budget

### Income
- `incomes(budgetId)` - List all incomes
- `createIncome(input)` - Create income entry
- `updateIncome(input)` - Update income
- `deleteIncome(id)` - Delete income

### Expense
- `expenses(budgetId)` - List all expenses
- `createExpense(input)` - Create expense (with splits)
- `updateExpense(input)` - Update expense
- `deleteExpense(id)` - Delete expense

### Category
- `expenseCategories(budgetId)` - List all categories
- `createExpenseCategory(input)` - Create category
- `updateExpenseCategory(input)` - Update category
- `deleteExpenseCategory(id)` - Delete category

## Remaining Tasks

### Dialog Updates (⏳ IN PROGRESS)
The following components need to be updated to work with new types:
- [ ] `components/budgetDialog/BudgetDialog.tsx`
- [ ] `components/income/*.tsx` dialogs
- [ ] `components/expense/*.tsx` dialogs
- [ ] `components/expense_category/*.tsx` dialogs (if exists)
- [ ] `components/goal/*.tsx` dialogs (verify no changes needed)

### Testing (⏳ IN PROGRESS)
Add unit tests for:
- [ ] All dialog components
- [ ] All hooks with various scenarios
- [ ] Error handling and edge cases
- [ ] Form validation
- [ ] GraphQL error handling

### E2E Testing
Setup end-to-end tests with:
- [ ] Cypress or Playwright
- [ ] Test complete user flows
- [ ] Backend API integration

## How to Complete Remaining Work

### 1. Update Dialogs (Priority: HIGH)
Follow the `DIALOG_UPDATE_GUIDE.md` for each dialog:
1. Change all `number` IDs to `string`
2. Change all `number` amounts to `string`
3. Update form validation to use schemas from `types/`
4. Update GraphQL mutations calls
5. Add error handling
6. Write unit tests

### 2. Run Tests
```bash
# Install testing dependencies
yarn add --dev jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom @types/jest

# Add test scripts to package.json
"test": "jest"
"test:watch": "jest --watch"
"test:coverage": "jest --coverage"

# Run tests
yarn test
```

### 3. Verify with Backend
1. Start backend: `cd breeze.api && make run`
2. Start frontend: `cd breeze.web && npm run dev`
3. Test all CRUD operations manually
4. Check browser console for GraphQL errors
5. Verify data appears correctly in UI

## Deprecations & Removals

### Removed from Income
- `isRecurring` - Use `recurringIncomes` query instead
- `recurrenceInterval` - Moved to RecurringIncome
- `paydayDayOfMonth` - Moved to RecurringIncome

### Removed from Expense
- Complex recurrence fields - Use recurring expenses separately
- `categoryId` (single) - Use `splits` array instead

### Removed from Category
- `sourceType`, `sourceTemplateId` - Not tracked at category level
- `generationMonth` - Not tracked at category level

## API Endpoint Changes

### Recurring Income Templates (✅ FIXED)
Previously attempted REST: `POST /recurring-income-templates`

Now using GraphQL: `POST /query`
- Query: `recurringIncomes(userId)`
- Mutations: `createRecurringIncome`, `updateRecurringIncome`, `deleteRecurringIncome`

## Common Issues & Solutions

### Issue: "Invalid UUID format"
**Solution**: Ensure all string IDs match UUID pattern. Use the dev UUID for testing:
```typescript
'550e8400-e29b-41d4-a716-446655440000'
```

### Issue: "Amount must be string"
**Solution**: Always convert amounts to strings before sending to API:
```typescript
amount: numberValue.toString()
```

### Issue: GraphQL query returns undefined
**Solution**: Check that query fields match the GraphQL schema in `breeze.api/graph/schema.graphqls`

### Issue: Test fails with "Cannot find module"
**Solution**: Ensure `jest.config.js` has correct `moduleNameMapper` for `@/` alias

## Performance Considerations

1. **React Query Caching**: Leverage `QueryClient` for efficient caching
2. **DataLoaders**: Use GraphQL DataLoaders for N+1 query prevention
3. **Lazy Loading**: Load categories before expenses
4. **Pagination**: Consider pagination for large expense lists (future)

## Security Considerations

1. **UUID Validation**: All IDs validated to be UUIDs
2. **User Isolation**: Always filter by userId in queries
3. **Decimal Precision**: Amounts kept as strings to prevent rounding errors
4. **Input Validation**: Zod schemas validate all form inputs

## Next Steps

1. **Immediate**: Update remaining dialog components
2. **Short-term**: Add comprehensive unit tests
3. **Medium-term**: Add E2E tests and CI/CD integration
4. **Long-term**: Add performance monitoring and optimization

## References

- GraphQL Schema: `/breeze.api/graph/schema.graphqls`
- Backend Instructions: `/breeze.api/.github/copilot-instructions.md`
- Type Definitions: `/app/budget/types/`
- GraphQL Queries: `/lib/services/queries/budget.ts`
- Dialog Update Guide: `/app/budget/DIALOG_UPDATE_GUIDE.md`
- Testing Documentation: `/TESTING.md`

## Questions & Issues?

Refer to:
1. `DIALOG_UPDATE_GUIDE.md` for dialog-specific questions
2. `TESTING.md` for testing questions
3. `README.md` for migration context
4. GraphQL schema for backend data structure
