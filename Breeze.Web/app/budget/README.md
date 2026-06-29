# Budget Directory Updates

This document outlines the changes made to the budget directory to work with the GraphQL backend schema.

## Key Changes

### Type Definitions

All TypeScript interfaces have been updated to match the GraphQL backend schema:

#### Budget (`types/budget.ts`)

- ✅ `id`, `userId` are now `string` (IDs)
- ✅ `monthlyIncome`, `monthlyExpenses` are now `string` (Decimal type)
- ✅ Added `createdAt`, `updatedAt` timestamps
- ✅ Form schema simplified to only include editable fields

#### Income (`types/income.ts`)

- ✅ `id`, `userId`, `budgetId` are now `string`
- ✅ `amount` is now `string` (Decimal type)
- ✅ `sourceType` is `'MANUAL' | 'RECURRING_TEMPLATE'` (enum)
- ✅ Removed `isRecurring`, `recurrenceInterval`, `paydayDayOfMonth` (these belong to RecurringIncome)
- ✅ Added `generationMonth` for tracking auto-generated incomes
- ✅ Added `createdAt`, `updatedAt` timestamps

#### Expense (`types/expense.ts`)

- ✅ `id`, `userId`, `budgetId` are now `string`
- ✅ `amount` is now `string` (Decimal type)
- ✅ Added `ExpenseSplit` interface for expense split allocation
- ✅ `description` is required field
- ✅ `splits` required to allocate expense across multiple categories
- ✅ Removed complex recurrence fields
- ✅ Added `createdAt`, `updatedAt` timestamps

#### Category (`types/category.ts`)

- ✅ `id`, `userId`, `budgetId` are now `string`
- ✅ `allocation`, `currentSpend` are now `string` (Decimal type)
- ✅ Removed `sourceType`, `sourceTemplateId`, `generationMonth`
- ✅ Added `createdAt`, `updatedAt` timestamps
- ✅ Form schema simplified

### Hooks Updates

All data-fetching hooks have been updated to work with string IDs and Decimal amounts:

#### `hooks/income/useIncomes.ts`

- ✅ Changed `budgetId` parameter from `number` to `string`
- ✅ `postIncome` returns `string` ID instead of `number`
- ✅ `patchIncome` returns `string` ID instead of `number`
- ✅ `deleteIncome` takes `incomeId: string` instead of full object
- ✅ Removed `as unknown as Record<string, unknown>` type casts

#### `hooks/expense/useExpenses.ts`

- ✅ Changed `budgetId` parameter from `number` to `string`
- ✅ Removed `getExpensesForCategory` (filter by categoryId locally instead)
- ✅ Updated expense payload to include `splits` array
- ✅ `postExpense` and `patchExpense` now handle expense splits
- ✅ Removed type casts

#### `hooks/category/useCategories.ts`

- ✅ Changed `budgetId` parameter from `number` to `string`
- ✅ `postCategory` now takes `budgetId` and `userId` as separate parameters
- ✅ Returns `string` ID instead of `number`
- ✅ `deleteCategory` takes `categoryId: string` instead of full object
- ✅ Removed type casts

### Remaining Tasks

The following dialogs and components still need updates:

- [ ] `components/budgetDialog/BudgetDialog.tsx` - Update to handle Budget form with monthly income/expenses
- [ ] `components/income/IncomeDialog.tsx` - Update to work with new Income structure
- [ ] `components/expense/ExpenseDialog.tsx` - Update to handle expense splits
- [ ] `components/goal/GoalDialog.tsx` - Update if needed
- [ ] All dependent hooks in subdirectories

## Migration Guide

### For Component Developers

When updating dialogs and components:

1. **ID Handling**: All IDs are now strings (not numbers)

   ```typescript
   // Before
   const budgetId: number = 123;

   // After
   const budgetId: string = '550e8400-e29b-41d4-a716-446655440000';
   ```

2. **Decimal Values**: Amounts/allocations are strings, not numbers

   ```typescript
   // Before
   const amount: number = 100.5;

   // After
   const amount: string = '100.50';
   ```

3. **Form Handling**: Use form schemas from types

   ```typescript
   import { incomeFormSchema } from '@/app/budget/types/income';

   const form = useForm<Income>({
     resolver: zodResolver(incomeFormSchema),
   });
   ```

4. **Expense Splits**: Expenses now require splits across categories
   ```typescript
   const expense = {
     description: 'Groceries',
     amount: '150.00',
     date: '2024-05-01',
     splits: [
       { categoryId: 'cat-123', amount: '100.00' },
       { categoryId: 'cat-456', amount: '50.00' },
     ],
   };
   ```

## GraphQL Queries Available

All CRUD operations are defined in `/lib/services/queries/budget.ts`:

- `GET_BUDGET_BY_DATE` - Fetch budget for a specific month
- `GET_INCOMES_BY_BUDGET` - List all incomes for a budget
- `CREATE_INCOME` / `UPDATE_INCOME` / `DELETE_INCOME`
- `GET_EXPENSES_BY_BUDGET` - List all expenses for a budget
- `CREATE_EXPENSE` / `UPDATE_EXPENSE` / `DELETE_EXPENSE`
- `GET_CATEGORIES` - List all categories for a budget
- `CREATE_EXPENSE_CATEGORY` / `UPDATE_EXPENSE_CATEGORY` / `DELETE_EXPENSE_CATEGORY`
- `GET_GOALS` - List all goals for a user
- `CREATE_GOAL` / `UPDATE_GOAL` / `DELETE_GOAL`

## Testing

Unit tests have been set up using Jest and React Testing Library. See [TESTING.md](./TESTING.md) for details on running and writing tests.

Example test file: `__tests__/hooks/useIncomes.test.ts`

## Next Steps

1. Update all dialog components to use new type definitions
2. Test all CRUD operations with backend API
3. Add more comprehensive unit tests
4. Set up E2E tests with Cypress or Playwright
5. Performance optimize with React Query cache strategies
