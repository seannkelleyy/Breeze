import { graphql } from '@/lib/gql';

export const GET_RECURRING_EXPENSES = graphql(`
  query GetRecurringExpenses($userId: ID!) {
    recurringExpenses(userId: $userId) {
      id
      userId
      name
      amount
      recurrenceInterval
      paydayDayOfMonth
      startDate
      endDate
      personId
      createdAt
      updatedAt
    }
  }
`);

export const GET_RECURRING_INCOMES = graphql(`
  query GetRecurringIncomes($userId: ID!) {
    recurringIncomes(userId: $userId) {
      id
      userId
      name
      amount
      recurrenceInterval
      paydayDayOfMonth
      startDate
      endDate
      personId
      createdAt
      updatedAt
    }
  }
`);

export const CREATE_RECURRING_INCOME = graphql(`
  mutation CreateRecurringIncome($input: CreateRecurringIncomeInput!) {
    createRecurringIncome(input: $input) {
      id
      userId
      name
      amount
      recurrenceInterval
      paydayDayOfMonth
      startDate
      endDate
      personId
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_RECURRING_INCOME = graphql(`
  mutation UpdateRecurringIncome($input: UpdateRecurringIncomeInput!) {
    updateRecurringIncome(input: $input) {
      id
      userId
      name
      amount
      recurrenceInterval
      paydayDayOfMonth
      startDate
      endDate
      personId
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_RECURRING_INCOME = graphql(`
  mutation DeleteRecurringIncome($id: ID!) {
    deleteRecurringIncome(id: $id)
  }
`);

export const CREATE_RECURRING_EXPENSE = graphql(`
  mutation CreateRecurringExpense($input: CreateRecurringExpenseInput!) {
    createRecurringExpense(input: $input) {
      id
      userId
      name
      amount
      recurrenceInterval
      paydayDayOfMonth
      startDate
      endDate
      personId
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_RECURRING_EXPENSE = graphql(`
  mutation UpdateRecurringExpense($input: UpdateRecurringExpenseInput!) {
    updateRecurringExpense(input: $input) {
      id
      userId
      name
      amount
      recurrenceInterval
      paydayDayOfMonth
      startDate
      endDate
      personId
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_RECURRING_EXPENSE = graphql(`
  mutation DeleteRecurringExpense($id: ID!) {
    deleteRecurringExpense(id: $id)
  }
`);
