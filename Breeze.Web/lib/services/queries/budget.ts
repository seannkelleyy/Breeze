export const GET_BUDGET_BY_DATE = `
  query GetBudgetByDate($userId: ID!, $date: String!) {
    budgetByDate(userId: $userId, date: $date) {
      id
      userId
      date
      monthlyIncome
      monthlyExpenses
      createdAt
      updatedAt
    }
  }
`;

export const GET_EXPENSES_BY_BUDGET = `
  query GetExpensesByBudget($budgetId: ID!) {
    expenses(budgetId: $budgetId) {
      id
      userId
      budgetId
      amount
      date
      description
      splits {
        id
        categoryId
        amount
        description
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_INCOMES_BY_BUDGET = `
  query GetIncomesByBudget($budgetId: ID!) {
    incomes(budgetId: $budgetId) {
      id
      userId
      budgetId
      name
      amount
      date
      sourceType
      sourceTemplateId
      sourceOccurrenceDate
      generationMonth
      createdAt
      updatedAt
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories($budgetId: ID!) {
    expenseCategories(budgetId: $budgetId) {
      id
      userId
      budgetId
      name
      allocation
      currentSpend
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_EXPENSE_CATEGORY = `
  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {
    createExpenseCategory(input: $input) {
      id
      userId
      budgetId
      name
      allocation
      currentSpend
    }
  }
`;

export const UPDATE_EXPENSE_CATEGORY = `
  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {
    updateExpenseCategory(input: $input) {
      id
      name
      allocation
      currentSpend
    }
  }
`;

export const DELETE_EXPENSE_CATEGORY = `
  mutation DeleteExpenseCategory($id: ID!) {
    deleteExpenseCategory(id: $id)
  }
`;

export const CREATE_EXPENSE = `
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
      userId
      budgetId
      amount
      date
      description
      splits {
        id
        categoryId
        amount
        description
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_EXPENSE = `
  mutation UpdateExpense($input: UpdateExpenseInput!) {
    updateExpense(input: $input) {
      id
      userId
      budgetId
      amount
      date
      description
      splits {
        id
        categoryId
        amount
        description
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_EXPENSE = `
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id)
  }
`;

export const CREATE_INCOME = `
  mutation CreateIncome($input: CreateIncomeInput!) {
    createIncome(input: $input) {
      id
      userId
      budgetId
      name
      amount
      date
      sourceType
      sourceTemplateId
      sourceOccurrenceDate
      generationMonth
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_INCOME = `
  mutation UpdateIncome($input: UpdateIncomeInput!) {
    updateIncome(input: $input) {
      id
      userId
      budgetId
      name
      amount
      date
      sourceType
      sourceTemplateId
      sourceOccurrenceDate
      generationMonth
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_INCOME = `
  mutation DeleteIncome($id: ID!) {
    deleteIncome(id: $id)
  }
`;

export const GET_GOALS = `
  query GetGoals($userId: ID!) {
    goals(userId: $userId) {
      id
      userId
      description
      isCompleted
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_GOAL = `
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
      id
      userId
      description
      isCompleted
    }
  }
`;

export const UPDATE_GOAL = `
  mutation UpdateGoal($input: UpdateGoalInput!) {
    updateGoal(input: $input) {
      id
      description
      isCompleted
    }
  }
`;

export const DELETE_GOAL = `
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`;
