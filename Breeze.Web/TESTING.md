# Testing Setup Guide

This document explains how to set up and run tests for the Breeze UI project.

## Installation

First, install the required testing dependencies:

```bash
yarn add --dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @types/jest
```

## Configuration Files

The following configuration files have been created:

### `jest.config.js`
- Configures Jest with Next.js support
- Sets up module aliasing for `@/` imports
- Configures coverage collection

### `jest.setup.js`
- Sets up testing library globals
- Mocks Next.js router and navigation
- Suppresses known console warnings

### `__tests__/test-utils.tsx`
- Exports custom `renderWithProviders` function
- Wraps components with React Query QueryClientProvider
- Simplifies testing of hooks and components that use React Query

## Running Tests

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Then run tests with:

```bash
yarn test                 # Run tests once
yarn test:watch         # Run tests in watch mode
yarn test:coverage      # Run tests and generate coverage report
```

## Writing Tests

### Testing Hooks

Use the custom `renderWithProviders` hook from `__tests__/test-utils.tsx`:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import useIncomes from '@/app/budget/hooks/income/useIncomes'
import { renderWithProviders } from '@/__tests__/test-utils'

describe('useIncomes', () => {
  it('should fetch incomes', async () => {
    const { result } = renderHook(() => useIncomes(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    })

    const incomes = await result.current.getIncomes('budget-123')
    expect(incomes).toBeDefined()
  })
})
```

### Testing Components

```typescript
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/__tests__/test-utils'
import MyComponent from '@/app/budget/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(screen.getByText(/clicked/i)).toBeInTheDocument()
  })
})
```

### Mocking GraphQL Services

Mock `useGraphql` hook in your tests:

```typescript
jest.mock('@/lib/services/useGraphql', () => ({
  __esModule: true,
  default: () => ({
    request: jest.fn((query, variables) => {
      // Return mock data based on query type
      return Promise.resolve({
        // Mock response
      })
    }),
  }),
}))
```

## Test File Structure

Place test files in the `__tests__` directory mirroring the source structure:

```
__tests__/
├── hooks/
│   ├── useIncomes.test.ts
│   ├── useCategories.test.ts
│   └── useExpenses.test.ts
├── components/
│   ├── BudgetDialog.test.tsx
│   ├── IncomeDialog.test.tsx
│   └── ExpenseDialog.test.tsx
└── test-utils.tsx
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what users see and interact with
2. **Use meaningful test descriptions**: Describe what should happen
3. **Mock external dependencies**: Mock GraphQL calls, router, etc.
4. **Keep tests isolated**: Each test should be independent
5. **Use `waitFor` for async operations**: Wait for promises to resolve
6. **Clean up after tests**: Jest handles this automatically with Jest 25+

## Example Test File

See `__tests__/hooks/useIncomes.test.ts` for a working example.

## Continuous Integration

To run tests in CI/CD pipelines:

```bash
yarn test --coverage --ci --maxWorkers=2
```

This runs tests without watch mode and generates coverage reports suitable for CI systems.
