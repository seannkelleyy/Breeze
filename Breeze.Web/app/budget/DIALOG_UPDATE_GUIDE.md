# Dialog Update Guide

This guide provides detailed instructions for updating all budget dialogs to work with the new GraphQL schema.

## Overview of Changes

### 1. ID Type Changes (number → string)
- All IDs are now strings: `id`, `budgetId`, `userId`, `categoryId`
- Update all type annotations and function parameters

### 2. Decimal Amount Changes (number → string)
- All monetary values: `amount`, `allocation`, `currentSpend`, `monthlyIncome`, `monthlyExpenses`
- Keep as strings throughout, convert to/from number only for display/input
- Use Decimal arithmetic if needed: parse string, calculate, convert back to string

### 3. Form Schema Changes
- Remove complex nested structures
- Use simplified schemas from `types/` directory
- Examples:
  - `incomeFormSchema` - only has `name`, `amount`, `date`
  - `categoryFormSchema` - only has `name`, `allocation`
  - `expenseFormSchema` - has `description`, `amount`, `date`, `splits`

## Dialog-by-Dialog Updates

### BudgetDialog

**Current State**: Handles creating/editing budget with monthly income and expenses summaries

**Changes Needed**:
1. Update type from `number` to `string` for IDs
2. Update amount fields from `number` to `string`
3. Update form submission to use GraphQL mutations from `useBudgets`
4. Format string values for display (convert to number for currency formatting)

**Example**:
```typescript
// Before
const budget: Budget = {
  id: 123,
  monthlyIncome: 5000,
  monthlyExpenses: 3000,
}

// After
const budget: Budget = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  monthlyIncome: '5000.00',
  monthlyExpenses: '3000.00',
  date: '2024-05-01',
  createdAt: '2024-05-01T00:00:00Z',
  updatedAt: '2024-05-01T00:00:00Z',
}
```

### IncomeDialog

**Current State**: Creates individual income entries

**Changes Needed**:
1. Update `budgetId` from `number` to `string`
2. Update `amount` from `number` to `string`
3. Use `incomeFormSchema` for validation
4. Call `postIncome(budgetId, incomeData)` (returns string ID)
5. Remove fields: `isRecurring`, `recurrenceInterval`, `paydayDayOfMonth`
6. Set `sourceType: 'MANUAL'` for manual income entries

**Example Form**:
```typescript
const form = useForm<Income>({
  resolver: zodResolver(incomeFormSchema),
  defaultValues: {
    name: '',
    amount: '0',
    date: new Date().toISOString().split('T')[0],
  },
})

const onSubmit = async (data: Income) => {
  const incomeData = {
    ...data,
    userId: currentUser.userId,
    sourceType: 'MANUAL' as const,
  }
  const incomeId = await postIncome(budgetId, incomeData)
}
```

### ExpenseDialog

**Current State**: Creates single expense entries (likely needs refactoring for splits)

**Changes Needed**:
1. Update ID types to strings
2. Update `amount` to string
3. **NEW**: Handle `splits` array (expense allocation across categories)
4. Use `expenseFormSchema` for validation
5. Form must include at least one split with categoryId and amount
6. Total of all splits must equal total expense amount

**Example Form**:
```typescript
const expenseForm = useForm<{
  description: string
  amount: string
  date: string
  splits: Array<{ categoryId: string; amount: string }>
}>({
  resolver: zodResolver(expenseFormSchema),
})

const onSubmit = async (data) => {
  // Validate splits sum to total amount
  const splitsTotal = data.splits.reduce((sum, s) => {
    return sum + parseFloat(s.amount)
  }, 0)
  
  if (parseFloat(data.amount) !== splitsTotal) {
    throw new Error('Splits must equal total expense amount')
  }
  
  const expenseId = await postExpense(budgetId, userId, {
    ...data,
    userId,
  })
}
```

### ExpenseCategoryDialog

**Current State**: Creates category allocations

**Changes Needed**:
1. Update ID types to strings
2. Update `allocation` from `number` to `string`
3. Remove `currentSpend` (it's calculated from actual expenses)
4. Use `categoryFormSchema` for validation
5. Call `postCategory(budgetId, userId, categoryData)`

**Example**:
```typescript
const categoryForm = useForm<Category>({
  resolver: zodResolver(categoryFormSchema),
  defaultValues: {
    name: '',
    allocation: '0',
  },
})

const onSubmit = async (data) => {
  const categoryId = await postCategory(budgetId, userId, data)
}
```

### GoalDialog

**Current State**: Creates financial goals

**Changes Needed**:
1. Check if `Goal` type needs updates (currently minimal)
2. Update ID types if needed
3. Verify GraphQL mutations work correctly

## Migration Checklist

For each dialog, ensure:

- [ ] All ID parameters changed from `number` to `string`
- [ ] All amount fields changed from `number` to `string`
- [ ] Form validation uses schema from `types/` directory
- [ ] Removed deprecated fields from old schema
- [ ] GraphQL mutations properly called with correct parameters
- [ ] Error handling implemented
- [ ] Loading states managed
- [ ] Response data properly typed
- [ ] Timestamps (`createdAt`, `updatedAt`) displayed if needed
- [ ] Unit tests written for the dialog

## Common Patterns

### String to Number Conversion for Display
```typescript
// For currency display
const displayAmount = parseFloat(stringAmount).toFixed(2)

// For currency input
const stringAmount = numberInput.toString()
```

### Handling Decimal Precision
```typescript
// When doing calculations
const total = (a: string, b: string): string => {
  return (parseFloat(a) + parseFloat(b)).toString()
}

// Or use a decimal library
import Decimal from 'decimal.js'
const result = new Decimal(a).plus(b).toString()
```

### Form Schema Usage
```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { incomeFormSchema } from '@/app/budget/types/income'

const form = useForm({
  resolver: zodResolver(incomeFormSchema),
})
```

### GraphQL Mutation Calls
```typescript
const { postIncome, patchIncome, deleteIncome } = useIncomes()

// Create
const newId = await postIncome(budgetId, incomeData)

// Update
const updatedId = await patchIncome({
  ...existingIncome,
  ...updates,
})

// Delete
await deleteIncome(incomeId)
```

## Testing Updated Dialogs

When writing tests, follow this pattern:

```typescript
import { renderWithProviders } from '@/__tests__/test-utils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IncomeDialog from '@/app/budget/components/income/IncomeDialog'

describe('IncomeDialog', () => {
  it('should create income with valid data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<IncomeDialog budgetId="budget-123" />)

    await user.type(screen.getByLabelText(/name/i), 'Salary')
    await user.type(screen.getByLabelText(/amount/i), '5000.00')
    await user.type(screen.getByLabelText(/date/i), '2024-05-01')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
  })

  it('should show validation errors for invalid data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<IncomeDialog budgetId="budget-123" />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
  })
})
```

## Resources

- GraphQL Schema: See `breeze.api/graph/schema.graphqls`
- Type Definitions: `/app/budget/types/`
- GraphQL Queries: `/lib/services/queries/budget.ts`
- Example Hook: `/app/budget/hooks/income/useIncomes.ts`
- Testing Setup: `/TESTING.md`
