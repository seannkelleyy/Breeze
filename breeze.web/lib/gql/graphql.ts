/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AssetType =
  | 'BROKERAGE'
  | 'CHECKING'
  | 'EMERGENCY_FUND'
  | 'HOME'
  | 'HSA'
  | 'OTHER'
  | 'ROTH_IRA'
  | 'TRADITIONAL_IRA'
  | 'VEHICLE'
  | '_401K'
  | '_403B'
  | '_457';

export type CreateAssetInput = {
  annualChangeRate?: string | null | undefined;
  annualRate: string;
  assetType: AssetType;
  contributionMode: string;
  contributionValue: string;
  currentValue: string;
  employerMatchMaxPercentOfSalary: string;
  employerMatchRate: string;
  homeGrowthProfile?: string | null | undefined;
  linkedLiabilityId?: string | number | null | undefined;
  name: string;
  personIds: Array<string | number>;
  pretaxSharePercent?: number | null | undefined;
  purchaseDate?: string | null | undefined;
  purchasePrice?: string | null | undefined;
  returnProfile?: string | null | undefined;
  taxTreatment: string;
  vehicleDepreciationProfile?: string | null | undefined;
};

export type CreateBudgetInput = {
  date: string;
  monthlyExpenses: string;
  monthlyIncome: string;
  payrollIncomes?: Array<PayrollIncomeInput> | null | undefined;
};

export type CreateExpenseCategoryInput = {
  allocation: string;
  budgetId: string | number;
  currentSpend: string;
  name: string;
};

export type CreateExpenseInput = {
  amount: string;
  budgetId: string | number;
  date: string;
  description: string;
  personId?: string | number | null | undefined;
  splits: Array<ExpenseSplitInput>;
};

export type CreateGoalInput = {
  category?: string | null | undefined;
  connectedAccountIds: Array<string | number>;
  customCategory?: string | null | undefined;
  description: string;
  financialOrderStep?: number | null | undefined;
  isCompleted: boolean;
  isFinancialOrderStep: boolean;
  notes?: string | null | undefined;
  priority: number;
  targetAmount?: string | null | undefined;
  targetDate?: string | null | undefined;
};

export type CreateHsaReceiptInput = {
  amount: string;
  description: string;
  incurredOn: string;
};

export type CreateHsaReimbursementInput = {
  amount: string;
  note?: string | null | undefined;
  reimbursedOn: string;
};

export type CreateIncomeInput = {
  amount: string;
  budgetId: string | number;
  date: string;
  generationMonth?: string | null | undefined;
  name: string;
  personId?: string | number | null | undefined;
  sourceOccurrenceDate?: string | null | undefined;
  sourceTemplateId?: string | number | null | undefined;
  sourceType: IncomeSourceType;
};

export type CreateLiabilityInput = {
  contributionMode: string;
  contributionValue: string;
  currentBalance: string;
  interestRate: string;
  liabilityType: LiabilityType;
  minimumPayment: string;
  name: string;
  originalLoanAmount?: string | null | undefined;
  payoffPriority: number;
  personIds: Array<string | number>;
  targetExtraPayment: string;
};

export type CreateNetWorthSnapshotInput = {
  items?: Array<NetWorthSnapshotItemInput> | null | undefined;
  netWorth: string;
  snapshotDate: string;
  totalAssets: string;
  totalLiabilities: string;
};

export type CreateRecurringExpenseInput = {
  amount: string;
  endDate?: string | null | undefined;
  name: string;
  paydayDayOfMonth?: number | null | undefined;
  personId?: string | number | null | undefined;
  recurrenceInterval: RecurrenceInterval;
  startDate: string;
};

export type CreateRecurringIncomeInput = {
  amount: string;
  endDate?: string | null | undefined;
  name: string;
  paydayDayOfMonth?: number | null | undefined;
  personId?: string | number | null | undefined;
  recurrenceInterval: RecurrenceInterval;
  startDate: string;
};

export type CreateRothConversionInput = {
  amount: string;
  convertedOn: string;
  fromAssetId?: string | number | null | undefined;
  note?: string | null | undefined;
  toAssetId?: string | number | null | undefined;
};

export type CreateUserInput = {
  currencyType: string;
  deductionAmount?: string | null | undefined;
  deductionType: DeductionType;
  email: string;
  filingStatus: FilingStatus;
  inflationRate: string;
  maxTaxBracketId?: string | number | null | undefined;
  payoffStrategy: PayoffStrategy;
  returnType: ReturnType;
  safeWithdrawalRate: string;
};

export type DeductionType =
  | 'ITEMIZED'
  | 'STANDARD';

export type ExpenseSourceType =
  | 'MANUAL'
  | 'RECURRING_TEMPLATE';

export type ExpenseSplitInput = {
  amount: string;
  categoryId: string | number;
  description?: string | null | undefined;
};

export type FilingStatus =
  | 'HOH'
  | 'MFJ'
  | 'MFS'
  | 'SINGLE';

export type IncomeSourceType =
  | 'MANUAL'
  | 'RECURRING_TEMPLATE';

export type LiabilityType =
  | 'AUTO_LOAN'
  | 'CREDIT_CARD'
  | 'MORTGAGE'
  | 'OTHER'
  | 'PERSONAL_LOAN'
  | 'STUDENT_LOAN';

export type NetWorthSnapshotItemInput = {
  accountId?: string | number | null | undefined;
  amount: string;
  kind: string;
  label: string;
};

export type PayoffStrategy =
  | 'AVALANCHE'
  | 'SNOWBALL';

export type PayrollIncomeInput = {
  amount: string;
  date: string;
  name: string;
  personId: string | number;
};

export type RecurrenceInterval =
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'NONE'
  | 'QUARTERLY'
  | 'WEEKLY'
  | 'YEARLY';

export type RetirementAccountType =
  | 'ACCOUNT_401K'
  | 'ACCOUNT_403B'
  | 'ACCOUNT_457'
  | 'HSA'
  | 'OTHER'
  | 'ROTH_IRA'
  | 'TRADITIONAL_IRA';

export type ReturnType =
  | 'NOMINAL'
  | 'REAL';

export type UpdateAssetInput = {
  annualChangeRate?: string | null | undefined;
  annualRate: string;
  assetType: AssetType;
  contributionMode: string;
  contributionValue: string;
  currentValue: string;
  employerMatchMaxPercentOfSalary: string;
  employerMatchRate: string;
  homeGrowthProfile?: string | null | undefined;
  id: string | number;
  linkedLiabilityId?: string | number | null | undefined;
  name: string;
  personIds: Array<string | number>;
  pretaxSharePercent?: number | null | undefined;
  purchaseDate?: string | null | undefined;
  purchasePrice?: string | null | undefined;
  returnProfile?: string | null | undefined;
  taxTreatment: string;
  vehicleDepreciationProfile?: string | null | undefined;
};

export type UpdateExpenseCategoryInput = {
  allocation: string;
  currentSpend: string;
  id: string | number;
  name: string;
};

export type UpdateExpenseInput = {
  amount: string;
  date: string;
  description: string;
  id: string | number;
  personId?: string | number | null | undefined;
  splits: Array<ExpenseSplitInput>;
};

export type UpdateGoalInput = {
  category?: string | null | undefined;
  connectedAccountIds: Array<string | number>;
  customCategory?: string | null | undefined;
  description: string;
  financialOrderStep?: number | null | undefined;
  id: string | number;
  isCompleted: boolean;
  isFinancialOrderStep: boolean;
  notes?: string | null | undefined;
  priority: number;
  targetAmount?: string | null | undefined;
  targetDate?: string | null | undefined;
};

export type UpdateIncomeInput = {
  amount: string;
  date: string;
  generationMonth?: string | null | undefined;
  id: string | number;
  name: string;
  personId?: string | number | null | undefined;
  sourceOccurrenceDate?: string | null | undefined;
  sourceTemplateId?: string | number | null | undefined;
  sourceType: IncomeSourceType;
};

export type UpdateLiabilityInput = {
  contributionMode: string;
  contributionValue: string;
  currentBalance: string;
  id: string | number;
  interestRate: string;
  liabilityType: LiabilityType;
  minimumPayment: string;
  name: string;
  originalLoanAmount?: string | null | undefined;
  payoffPriority: number;
  personIds: Array<string | number>;
  targetExtraPayment: string;
};

export type UpdateRecurringExpenseInput = {
  amount: string;
  endDate?: string | null | undefined;
  id: string | number;
  name: string;
  paydayDayOfMonth?: number | null | undefined;
  personId?: string | number | null | undefined;
  recurrenceInterval: RecurrenceInterval;
  startDate: string;
};

export type UpdateRecurringIncomeInput = {
  amount: string;
  endDate?: string | null | undefined;
  id: string | number;
  name: string;
  paydayDayOfMonth?: number | null | undefined;
  personId?: string | number | null | undefined;
  recurrenceInterval: RecurrenceInterval;
  startDate: string;
};

export type UpdateUserInput = {
  currencyType: string;
  deductionAmount?: string | null | undefined;
  deductionType: DeductionType;
  filingStatus: FilingStatus;
  inflationRate: string;
  maxTaxBracketId?: string | number | null | undefined;
  payoffStrategy: PayoffStrategy;
  returnType: ReturnType;
  safeWithdrawalRate: string;
};

export type UpdateUserSetupInput = {
  budgetEnabled?: boolean | null | undefined;
  disclaimerAccepted?: boolean | null | undefined;
  disclaimerAcceptedAt?: string | null | undefined;
  monthlyExpenses?: string | null | undefined;
  setupCompleted?: boolean | null | undefined;
};

export type UpsertPaycheckDeductionInput = {
  amount: string;
  id: string | number;
  kind: string;
  linkedAccountId?: string | number | null | undefined;
  name: string;
  personId: string | number;
  pretax: boolean;
};

export type UpsertPlannerPersonInput = {
  annualBonus: string;
  annualSalary: string;
  birthday: string;
  bonusFrequency: string;
  bonusMode: string;
  expectedHoursPerWeek: string;
  hourlyRate: string;
  id: string | number;
  incomeGrowthRate: string;
  name: string;
  payCadence: string;
  payDay: number;
  payType: string;
  retirementAge: number;
};

export type AssetFieldsFragment = { id: string, userId: string, name: string, assetType: AssetType, currentValue: string, contributionMode: string, contributionValue: string, employerMatchRate: string, employerMatchMaxPercentOfSalary: string, annualRate: string, returnProfile: string | null, taxTreatment: string, pretaxSharePercent: number | null, personIds: Array<string>, purchaseDate: string | null, purchasePrice: string | null, homeGrowthProfile: string | null, vehicleDepreciationProfile: string | null, linkedLiabilityId: string | null, plaidAccountId: string | null, lastValueUpdatedAt: string, createdAt: string, updatedAt: string };

export type LiabilityFieldsFragment = { id: string, userId: string, name: string, liabilityType: LiabilityType, currentBalance: string, originalLoanAmount: string | null, interestRate: string, minimumPayment: string, targetExtraPayment: string, payoffPriority: number, contributionMode: string, contributionValue: string, personIds: Array<string>, plaidAccountId: string | null, lastBalanceUpdatedAt: string, createdAt: string, updatedAt: string };

export type GetAssetsByUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAssetsByUserQuery = { assets: Array<{ id: string, userId: string, name: string, assetType: AssetType, currentValue: string, contributionMode: string, contributionValue: string, employerMatchRate: string, employerMatchMaxPercentOfSalary: string, annualRate: string, returnProfile: string | null, taxTreatment: string, pretaxSharePercent: number | null, personIds: Array<string>, purchaseDate: string | null, purchasePrice: string | null, homeGrowthProfile: string | null, vehicleDepreciationProfile: string | null, linkedLiabilityId: string | null, plaidAccountId: string | null, lastValueUpdatedAt: string, createdAt: string, updatedAt: string }> };

export type GetLiabilitiesByUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLiabilitiesByUserQuery = { liabilities: Array<{ id: string, userId: string, name: string, liabilityType: LiabilityType, currentBalance: string, originalLoanAmount: string | null, interestRate: string, minimumPayment: string, targetExtraPayment: string, payoffPriority: number, contributionMode: string, contributionValue: string, personIds: Array<string>, plaidAccountId: string | null, lastBalanceUpdatedAt: string, createdAt: string, updatedAt: string }> };

export type CreateAssetMutationVariables = Exact<{
  input: CreateAssetInput;
}>;


export type CreateAssetMutation = { createAsset: { id: string, userId: string, name: string, assetType: AssetType, currentValue: string, contributionMode: string, contributionValue: string, employerMatchRate: string, employerMatchMaxPercentOfSalary: string, annualRate: string, returnProfile: string | null, taxTreatment: string, pretaxSharePercent: number | null, personIds: Array<string>, purchaseDate: string | null, purchasePrice: string | null, homeGrowthProfile: string | null, vehicleDepreciationProfile: string | null, linkedLiabilityId: string | null, plaidAccountId: string | null, lastValueUpdatedAt: string, createdAt: string, updatedAt: string } };

export type UpdateAssetMutationVariables = Exact<{
  input: UpdateAssetInput;
}>;


export type UpdateAssetMutation = { updateAsset: { id: string, userId: string, name: string, assetType: AssetType, currentValue: string, contributionMode: string, contributionValue: string, employerMatchRate: string, employerMatchMaxPercentOfSalary: string, annualRate: string, returnProfile: string | null, taxTreatment: string, pretaxSharePercent: number | null, personIds: Array<string>, purchaseDate: string | null, purchasePrice: string | null, homeGrowthProfile: string | null, vehicleDepreciationProfile: string | null, linkedLiabilityId: string | null, plaidAccountId: string | null, lastValueUpdatedAt: string, createdAt: string, updatedAt: string } };

export type CreateLiabilityMutationVariables = Exact<{
  input: CreateLiabilityInput;
}>;


export type CreateLiabilityMutation = { createLiability: { id: string, userId: string, name: string, liabilityType: LiabilityType, currentBalance: string, originalLoanAmount: string | null, interestRate: string, minimumPayment: string, targetExtraPayment: string, payoffPriority: number, contributionMode: string, contributionValue: string, personIds: Array<string>, plaidAccountId: string | null, lastBalanceUpdatedAt: string, createdAt: string, updatedAt: string } };

export type UpdateLiabilityMutationVariables = Exact<{
  input: UpdateLiabilityInput;
}>;


export type UpdateLiabilityMutation = { updateLiability: { id: string, userId: string, name: string, liabilityType: LiabilityType, currentBalance: string, originalLoanAmount: string | null, interestRate: string, minimumPayment: string, targetExtraPayment: string, payoffPriority: number, contributionMode: string, contributionValue: string, personIds: Array<string>, plaidAccountId: string | null, lastBalanceUpdatedAt: string, createdAt: string, updatedAt: string } };

export type DeleteAssetMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteAssetMutation = { deleteAsset: boolean };

export type DeleteLiabilityMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteLiabilityMutation = { deleteLiability: boolean };

export type LinkAssetToPlaidAccountMutationVariables = Exact<{
  assetId: string | number;
  plaidAccountId: string | number;
}>;


export type LinkAssetToPlaidAccountMutation = { linkAssetToPlaidAccount: boolean };

export type UnlinkAssetFromPlaidAccountMutationVariables = Exact<{
  assetId: string | number;
}>;


export type UnlinkAssetFromPlaidAccountMutation = { unlinkAssetFromPlaidAccount: boolean };

export type LinkLiabilityToPlaidAccountMutationVariables = Exact<{
  liabilityId: string | number;
  plaidAccountId: string | number;
}>;


export type LinkLiabilityToPlaidAccountMutation = { linkLiabilityToPlaidAccount: boolean };

export type UnlinkLiabilityFromPlaidAccountMutationVariables = Exact<{
  liabilityId: string | number;
}>;


export type UnlinkLiabilityFromPlaidAccountMutation = { unlinkLiabilityFromPlaidAccount: boolean };

export type GetBudgetByDateQueryVariables = Exact<{
  date: string;
}>;


export type GetBudgetByDateQuery = { budgetByDate: { id: string, userId: string, date: string, monthlyIncome: string, monthlyExpenses: string, createdAt: string, updatedAt: string } | null };

export type CreateBudgetMutationVariables = Exact<{
  input: CreateBudgetInput;
}>;


export type CreateBudgetMutation = { createBudget: { id: string, userId: string, date: string, monthlyIncome: string, monthlyExpenses: string, createdAt: string, updatedAt: string } };

export type CategoryFieldsFragment = { id: string, userId: string, budgetId: string, name: string, allocation: string, currentSpend: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, createdAt: string, updatedAt: string };

export type CreateExpenseCategoryMutationVariables = Exact<{
  input: CreateExpenseCategoryInput;
}>;


export type CreateExpenseCategoryMutation = { createExpenseCategory: { id: string, userId: string, budgetId: string, name: string, allocation: string, currentSpend: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, createdAt: string, updatedAt: string } };

export type UpdateExpenseCategoryMutationVariables = Exact<{
  input: UpdateExpenseCategoryInput;
}>;


export type UpdateExpenseCategoryMutation = { updateExpenseCategory: { id: string, userId: string, budgetId: string, name: string, allocation: string, currentSpend: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, createdAt: string, updatedAt: string } };

export type DeleteExpenseCategoryMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteExpenseCategoryMutation = { deleteExpenseCategory: boolean };

export type GetCategoriesQueryVariables = Exact<{
  budgetId: string | number;
}>;


export type GetCategoriesQuery = { expenseCategories: Array<{ id: string, userId: string, budgetId: string, name: string, allocation: string, currentSpend: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, createdAt: string, updatedAt: string }> };

export type ExchangePlaidPublicTokenMutationVariables = Exact<{
  publicToken: string;
}>;


export type ExchangePlaidPublicTokenMutation = { exchangePlaidPublicToken: { id: string, userId: string, environment: string, itemId: string, institutionId: string | null, institutionName: string | null, updatedAt: string, createdAt: string } };

export type SyncPlaidConnectionMutationVariables = Exact<{
  id: string | number;
}>;


export type SyncPlaidConnectionMutation = { syncPlaidConnection: boolean };

export type DeletePlaidConnectionMutationVariables = Exact<{
  id: string | number;
}>;


export type DeletePlaidConnectionMutation = { deletePlaidConnection: boolean };

export type PlaidConnectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type PlaidConnectionsQuery = { plaidConnections: Array<{ id: string, userId: string, environment: string, itemId: string, institutionId: string | null, institutionName: string | null, updatedAt: string, createdAt: string }> };

export type PlaidAccountsQueryVariables = Exact<{
  connectionId: string | number;
}>;


export type PlaidAccountsQuery = { plaidAccounts: Array<{ id: string, plaidConnectionId: string, externalId: string, name: string, officialName: string | null, type: string | null, subtype: string | null, currentBalance: string | null, isoCurrencyCode: string | null, createdAt: string, updatedAt: string }> };

export type CreatePlaidLinkTokenQueryVariables = Exact<{ [key: string]: never; }>;


export type CreatePlaidLinkTokenQuery = { createPlaidLinkToken: string };

export type ExpenseFieldsFragment = { id: string, userId: string, budgetId: string, amount: string, date: string, description: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string, splits: Array<{ id: string, categoryId: string, amount: string, description: string | null }> };

export type CreateExpenseMutationVariables = Exact<{
  input: CreateExpenseInput;
}>;


export type CreateExpenseMutation = { createExpense: { id: string, userId: string, budgetId: string, amount: string, date: string, description: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string, splits: Array<{ id: string, categoryId: string, amount: string, description: string | null }> } };

export type UpdateExpenseMutationVariables = Exact<{
  input: UpdateExpenseInput;
}>;


export type UpdateExpenseMutation = { updateExpense: { id: string, userId: string, budgetId: string, amount: string, date: string, description: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string, splits: Array<{ id: string, categoryId: string, amount: string, description: string | null }> } };

export type DeleteExpenseMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteExpenseMutation = { deleteExpense: boolean };

export type GetExpensesByBudgetQueryVariables = Exact<{
  budgetId: string | number;
}>;


export type GetExpensesByBudgetQuery = { expenses: Array<{ id: string, userId: string, budgetId: string, amount: string, date: string, description: string, sourceType: ExpenseSourceType, sourceTemplateId: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string, splits: Array<{ id: string, categoryId: string, amount: string, description: string | null }> }> };

export type GetGoalsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGoalsQuery = { goals: Array<{ id: string, userId: string, description: string, isCompleted: boolean, targetAmount: string | null, targetDate: string | null, category: string | null, customCategory: string | null, priority: number, notes: string | null, connectedAccountIds: Array<string>, isFinancialOrderStep: boolean, financialOrderStep: number | null, createdAt: string, updatedAt: string }> };

export type CreateGoalMutationVariables = Exact<{
  input: CreateGoalInput;
}>;


export type CreateGoalMutation = { createGoal: { id: string, userId: string, description: string, isCompleted: boolean, targetAmount: string | null, targetDate: string | null, category: string | null, customCategory: string | null, priority: number, notes: string | null, connectedAccountIds: Array<string>, isFinancialOrderStep: boolean, financialOrderStep: number | null, createdAt: string, updatedAt: string } };

export type UpdateGoalMutationVariables = Exact<{
  input: UpdateGoalInput;
}>;


export type UpdateGoalMutation = { updateGoal: { id: string, userId: string, description: string, isCompleted: boolean, targetAmount: string | null, targetDate: string | null, category: string | null, customCategory: string | null, priority: number, notes: string | null, connectedAccountIds: Array<string>, isFinancialOrderStep: boolean, financialOrderStep: number | null, createdAt: string, updatedAt: string } };

export type DeleteGoalMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteGoalMutation = { deleteGoal: boolean };

export type CreateFinancialOrderStepsMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateFinancialOrderStepsMutation = { createFinancialOrderSteps: Array<{ id: string, userId: string, description: string, isCompleted: boolean, targetAmount: string | null, targetDate: string | null, category: string | null, customCategory: string | null, priority: number, notes: string | null, connectedAccountIds: Array<string>, isFinancialOrderStep: boolean, financialOrderStep: number | null, createdAt: string, updatedAt: string }> };

export type IncomeFieldsFragment = { id: string, userId: string, budgetId: string, name: string, amount: string, date: string, sourceType: IncomeSourceType, sourceTemplateId: string | null, sourceOccurrenceDate: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string };

export type CreateIncomeMutationVariables = Exact<{
  input: CreateIncomeInput;
}>;


export type CreateIncomeMutation = { createIncome: { id: string, userId: string, budgetId: string, name: string, amount: string, date: string, sourceType: IncomeSourceType, sourceTemplateId: string | null, sourceOccurrenceDate: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string } };

export type UpdateIncomeMutationVariables = Exact<{
  input: UpdateIncomeInput;
}>;


export type UpdateIncomeMutation = { updateIncome: { id: string, userId: string, budgetId: string, name: string, amount: string, date: string, sourceType: IncomeSourceType, sourceTemplateId: string | null, sourceOccurrenceDate: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string } };

export type DeleteIncomeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteIncomeMutation = { deleteIncome: boolean };

export type GetIncomesByBudgetQueryVariables = Exact<{
  budgetId: string | number;
}>;


export type GetIncomesByBudgetQuery = { incomes: Array<{ id: string, userId: string, budgetId: string, name: string, amount: string, date: string, sourceType: IncomeSourceType, sourceTemplateId: string | null, sourceOccurrenceDate: string | null, generationMonth: string | null, personId: string | null, createdAt: string, updatedAt: string }> };

export type PaycheckDeductionsQueryVariables = Exact<{
  personId: string | number;
}>;


export type PaycheckDeductionsQuery = { paycheckDeductions: Array<{ id: string, userId: string, personId: string, name: string, amount: string, pretax: boolean, kind: string, linkedAccountId: string | null, createdAt: string, updatedAt: string }> };

export type UpsertPaycheckDeductionMutationVariables = Exact<{
  input: UpsertPaycheckDeductionInput;
}>;


export type UpsertPaycheckDeductionMutation = { upsertPaycheckDeduction: { id: string, userId: string, personId: string, name: string, amount: string, pretax: boolean, kind: string, linkedAccountId: string | null, createdAt: string, updatedAt: string } };

export type PaycheckDeductionsByUserQueryVariables = Exact<{ [key: string]: never; }>;


export type PaycheckDeductionsByUserQuery = { paycheckDeductionsByUser: Array<{ id: string, userId: string, personId: string, name: string, amount: string, pretax: boolean, kind: string, linkedAccountId: string | null, createdAt: string, updatedAt: string }> };

export type DeletePaycheckDeductionMutationVariables = Exact<{
  id: string | number;
}>;


export type DeletePaycheckDeductionMutation = { deletePaycheckDeduction: boolean };

export type UpsertPlannerPersonMutationVariables = Exact<{
  input: UpsertPlannerPersonInput;
}>;


export type UpsertPlannerPersonMutation = { upsertPlannerPerson: { id: string, userId: string, name: string, birthday: string, retirementAge: number, annualSalary: string, bonusMode: string, bonusFrequency: string, annualBonus: string, incomeGrowthRate: string, payType: string, payDay: number, payCadence: string, hourlyRate: string, expectedHoursPerWeek: string, createdAt: string, updatedAt: string } };

export type DeletePlannerPersonMutationVariables = Exact<{
  id: string | number;
}>;


export type DeletePlannerPersonMutation = { deletePlannerPerson: boolean };

export type PlannerPeopleQueryVariables = Exact<{ [key: string]: never; }>;


export type PlannerPeopleQuery = { plannerPeople: Array<{ id: string, userId: string, name: string, birthday: string, retirementAge: number, annualSalary: string, bonusMode: string, bonusFrequency: string, annualBonus: string, incomeGrowthRate: string, payType: string, payDay: number, payCadence: string, hourlyRate: string, expectedHoursPerWeek: string, createdAt: string, updatedAt: string }> };

export type ContributionLimitsQueryVariables = Exact<{
  taxYear: number;
}>;


export type ContributionLimitsQuery = { contributionLimits: Array<{ id: string, accountType: RetirementAccountType, taxYear: number, annualLimit: string, catchUpAge: number, catchUpAmount: string, familyAnnualLimit: string | null }> };

export type NetWorthSnapshotsQueryVariables = Exact<{ [key: string]: never; }>;


export type NetWorthSnapshotsQuery = { netWorthSnapshots: Array<{ id: string, userId: string, snapshotDate: string, totalAssets: string, totalLiabilities: string, netWorth: string, createdAt: string, updatedAt: string, items: Array<{ id: string, snapshotId: string, accountId: string | null, label: string, amount: string, kind: string }> }> };

export type CreateNetWorthSnapshotMutationVariables = Exact<{
  input: CreateNetWorthSnapshotInput;
}>;


export type CreateNetWorthSnapshotMutation = { createNetWorthSnapshot: { id: string, userId: string, snapshotDate: string, totalAssets: string, totalLiabilities: string, netWorth: string, createdAt: string, updatedAt: string, items: Array<{ id: string, snapshotId: string, accountId: string | null, label: string, amount: string, kind: string }> } };

export type DeleteNetWorthSnapshotMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteNetWorthSnapshotMutation = { deleteNetWorthSnapshot: boolean };

export type TransactionsQueryVariables = Exact<{
  fromDate?: string | null | undefined;
  toDate?: string | null | undefined;
}>;


export type TransactionsQuery = { transactions: Array<{ id: string, userId: string, plaidAccountId: string | null, plaidTransactionId: string | null, date: string, amount: string, name: string, expenseCategoryId: string | null, pending: boolean, createdAt: string, updatedAt: string }> };

export type AssignTransactionCategoryMutationVariables = Exact<{
  id: string | number;
  expenseCategoryId?: string | number | null | undefined;
}>;


export type AssignTransactionCategoryMutation = { assignTransactionCategory: { id: string, expenseCategoryId: string | null } };

export type DeleteTransactionMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTransactionMutation = { deleteTransaction: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, identityProviderId: string, inflationRate: string, safeWithdrawalRate: string, filingStatus: FilingStatus, returnType: ReturnType, currencyType: string, deductionType: DeductionType, deductionAmount: string | null, payoffStrategy: PayoffStrategy, maxTaxBracketId: string | null, createdAt: string, updatedAt: string } | null };

export type GetRecurringExpensesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRecurringExpensesQuery = { recurringExpenses: Array<{ id: string, userId: string, name: string, amount: string, recurrenceInterval: RecurrenceInterval, paydayDayOfMonth: number | null, startDate: string, endDate: string | null, personId: string | null, createdAt: string, updatedAt: string }> };

export type GetRecurringIncomesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRecurringIncomesQuery = { recurringIncomes: Array<{ id: string, userId: string, name: string, amount: string, recurrenceInterval: RecurrenceInterval, paydayDayOfMonth: number | null, startDate: string, endDate: string | null, personId: string | null, createdAt: string, updatedAt: string }> };

export type CreateRecurringIncomeMutationVariables = Exact<{
  input: CreateRecurringIncomeInput;
}>;


export type CreateRecurringIncomeMutation = { createRecurringIncome: { id: string, userId: string, name: string, amount: string, recurrenceInterval: RecurrenceInterval, paydayDayOfMonth: number | null, startDate: string, endDate: string | null, personId: string | null, createdAt: string, updatedAt: string } };

export type UpdateRecurringIncomeMutationVariables = Exact<{
  input: UpdateRecurringIncomeInput;
}>;


export type UpdateRecurringIncomeMutation = { updateRecurringIncome: { id: string, userId: string, name: string, amount: string, recurrenceInterval: RecurrenceInterval, paydayDayOfMonth: number | null, startDate: string, endDate: string | null, personId: string | null, createdAt: string, updatedAt: string } };

export type DeleteRecurringIncomeMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteRecurringIncomeMutation = { deleteRecurringIncome: boolean };

export type CreateRecurringExpenseMutationVariables = Exact<{
  input: CreateRecurringExpenseInput;
}>;


export type CreateRecurringExpenseMutation = { createRecurringExpense: { id: string, userId: string, name: string, amount: string, recurrenceInterval: RecurrenceInterval, paydayDayOfMonth: number | null, startDate: string, endDate: string | null, personId: string | null, createdAt: string, updatedAt: string } };

export type UpdateRecurringExpenseMutationVariables = Exact<{
  input: UpdateRecurringExpenseInput;
}>;


export type UpdateRecurringExpenseMutation = { updateRecurringExpense: { id: string, userId: string, name: string, amount: string, recurrenceInterval: RecurrenceInterval, paydayDayOfMonth: number | null, startDate: string, endDate: string | null, personId: string | null, createdAt: string, updatedAt: string } };

export type DeleteRecurringExpenseMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteRecurringExpenseMutation = { deleteRecurringExpense: boolean };

export type RetirementAccessQueryVariables = Exact<{ [key: string]: never; }>;


export type RetirementAccessQuery = { retirementAccess: { hsaReceipts: Array<{ id: string, userId: string, incurredOn: string, description: string, amount: string, createdAt: string, updatedAt: string }>, hsaReimbursements: Array<{ id: string, userId: string, reimbursedOn: string, amount: string, note: string, createdAt: string, updatedAt: string }>, hsaSummary: { totalReceipts: string, totalReimbursed: string, availableToReimburse: string }, rothConversions: Array<{ id: string, userId: string, convertedOn: string, amount: string, fromAssetId: string | null, toAssetId: string | null, note: string, createdAt: string, updatedAt: string }>, rothBuckets: Array<{ year: number, amount: string, availableOn: string, accessible: boolean }> } };

export type CreateHsaReceiptMutationVariables = Exact<{
  input: CreateHsaReceiptInput;
}>;


export type CreateHsaReceiptMutation = { createHsaReceipt: { id: string, userId: string, incurredOn: string, description: string, amount: string, createdAt: string, updatedAt: string } };

export type DeleteHsaReceiptMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteHsaReceiptMutation = { deleteHsaReceipt: boolean };

export type CreateHsaReimbursementMutationVariables = Exact<{
  input: CreateHsaReimbursementInput;
}>;


export type CreateHsaReimbursementMutation = { createHsaReimbursement: { id: string, userId: string, reimbursedOn: string, amount: string, note: string, createdAt: string, updatedAt: string } };

export type DeleteHsaReimbursementMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteHsaReimbursementMutation = { deleteHsaReimbursement: boolean };

export type CreateRothConversionMutationVariables = Exact<{
  input: CreateRothConversionInput;
}>;


export type CreateRothConversionMutation = { createRothConversion: { id: string, userId: string, convertedOn: string, amount: string, fromAssetId: string | null, toAssetId: string | null, note: string, createdAt: string, updatedAt: string } };

export type DeleteRothConversionMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteRothConversionMutation = { deleteRothConversion: boolean };

export type CalculateRetirementLadderQueryVariables = Exact<{
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  isRoth: boolean;
  year: number;
  filingStatus: FilingStatus;
  yearsToProject?: number | null | undefined;
}>;


export type CalculateRetirementLadderQuery = { calculateRetirementLadder: { initialBalance: string, annualExpenses: string, currentAge: number, firstWithdrawalAge: number, isRoth: boolean, isSustainable: boolean, projectedDepletionAge: number | null, projectedSteps: Array<{ year: number, age: number, withdrawalAmount: string, taxableWithdrawal: string, estimatedIncomeTax: string, earlyWithdrawalPenalty: string, netWithdrawal: string, remainingBalance: string, isAccessible: boolean }> } | null };

export type GetTaxYearDataQueryVariables = Exact<{
  filingStatus: FilingStatus;
}>;


export type GetTaxYearDataQuery = { taxYearData: { year: number, standardDeduction: string, ssWageBase: string, brackets: Array<{ minimumAmount: string, maximumAmount: string | null, rate: string }> } };

export type EstimateTaxesForYearQueryVariables = Exact<{
  year: number;
  filingStatus: FilingStatus;
  income: string;
  deduction?: string | null | undefined;
}>;


export type EstimateTaxesForYearQuery = { estimateTaxesForYear: { taxOwed: string, taxableIncome: string, effectiveRate: string, marginalRate: string } | null };

export type CurrentUserPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserPreferencesQuery = { me: { id: string, identityProviderId: string, email: string, returnType: ReturnType, safeWithdrawalRate: string, currencyType: string, inflationRate: string, deductionType: DeductionType, deductionAmount: string | null, maxTaxBracketId: string | null, filingStatus: FilingStatus, payoffStrategy: PayoffStrategy, budgetEnabled: boolean, monthlyExpenses: string | null, setupCompleted: boolean, disclaimerAccepted: boolean, disclaimerAcceptedAt: string | null } | null };

export type UpdateUserSetupMutationVariables = Exact<{
  input: UpdateUserSetupInput;
}>;


export type UpdateUserSetupMutation = { updateUserSetup: { id: string, budgetEnabled: boolean, monthlyExpenses: string | null, setupCompleted: boolean, disclaimerAccepted: boolean, disclaimerAcceptedAt: string | null } };

export type UpdateUserPreferencesMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserPreferencesMutation = { updateUser: { id: string } };

export type CreateUserPreferencesMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserPreferencesMutation = { createUser: { id: string } };

export const AssetFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchRate"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchMaxPercentOfSalary"}},{"kind":"Field","name":{"kind":"Name","value":"annualRate"}},{"kind":"Field","name":{"kind":"Name","value":"returnProfile"}},{"kind":"Field","name":{"kind":"Name","value":"taxTreatment"}},{"kind":"Field","name":{"kind":"Name","value":"pretaxSharePercent"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"purchasePrice"}},{"kind":"Field","name":{"kind":"Name","value":"homeGrowthProfile"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleDepreciationProfile"}},{"kind":"Field","name":{"kind":"Name","value":"linkedLiabilityId"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastValueUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AssetFieldsFragment, unknown>;
export const LiabilityFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LiabilityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Liability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"liabilityType"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"originalLoanAmount"}},{"kind":"Field","name":{"kind":"Name","value":"interestRate"}},{"kind":"Field","name":{"kind":"Name","value":"minimumPayment"}},{"kind":"Field","name":{"kind":"Name","value":"targetExtraPayment"}},{"kind":"Field","name":{"kind":"Name","value":"payoffPriority"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastBalanceUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<LiabilityFieldsFragment, unknown>;
export const CategoryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExpenseCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"currentSpend"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CategoryFieldsFragment, unknown>;
export const ExpenseFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpenseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"splits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ExpenseFieldsFragment, unknown>;
export const IncomeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IncomeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Income"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceOccurrenceDate"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<IncomeFieldsFragment, unknown>;
export const GetAssetsByUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAssetsByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchRate"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchMaxPercentOfSalary"}},{"kind":"Field","name":{"kind":"Name","value":"annualRate"}},{"kind":"Field","name":{"kind":"Name","value":"returnProfile"}},{"kind":"Field","name":{"kind":"Name","value":"taxTreatment"}},{"kind":"Field","name":{"kind":"Name","value":"pretaxSharePercent"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"purchasePrice"}},{"kind":"Field","name":{"kind":"Name","value":"homeGrowthProfile"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleDepreciationProfile"}},{"kind":"Field","name":{"kind":"Name","value":"linkedLiabilityId"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastValueUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetAssetsByUserQuery, GetAssetsByUserQueryVariables>;
export const GetLiabilitiesByUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLiabilitiesByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"liabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LiabilityFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LiabilityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Liability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"liabilityType"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"originalLoanAmount"}},{"kind":"Field","name":{"kind":"Name","value":"interestRate"}},{"kind":"Field","name":{"kind":"Name","value":"minimumPayment"}},{"kind":"Field","name":{"kind":"Name","value":"targetExtraPayment"}},{"kind":"Field","name":{"kind":"Name","value":"payoffPriority"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastBalanceUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetLiabilitiesByUserQuery, GetLiabilitiesByUserQueryVariables>;
export const CreateAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAssetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchRate"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchMaxPercentOfSalary"}},{"kind":"Field","name":{"kind":"Name","value":"annualRate"}},{"kind":"Field","name":{"kind":"Name","value":"returnProfile"}},{"kind":"Field","name":{"kind":"Name","value":"taxTreatment"}},{"kind":"Field","name":{"kind":"Name","value":"pretaxSharePercent"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"purchasePrice"}},{"kind":"Field","name":{"kind":"Name","value":"homeGrowthProfile"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleDepreciationProfile"}},{"kind":"Field","name":{"kind":"Name","value":"linkedLiabilityId"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastValueUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateAssetMutation, CreateAssetMutationVariables>;
export const UpdateAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAssetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"currentValue"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchRate"}},{"kind":"Field","name":{"kind":"Name","value":"employerMatchMaxPercentOfSalary"}},{"kind":"Field","name":{"kind":"Name","value":"annualRate"}},{"kind":"Field","name":{"kind":"Name","value":"returnProfile"}},{"kind":"Field","name":{"kind":"Name","value":"taxTreatment"}},{"kind":"Field","name":{"kind":"Name","value":"pretaxSharePercent"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"purchasePrice"}},{"kind":"Field","name":{"kind":"Name","value":"homeGrowthProfile"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleDepreciationProfile"}},{"kind":"Field","name":{"kind":"Name","value":"linkedLiabilityId"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastValueUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateAssetMutation, UpdateAssetMutationVariables>;
export const CreateLiabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLiability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLiabilityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLiability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LiabilityFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LiabilityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Liability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"liabilityType"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"originalLoanAmount"}},{"kind":"Field","name":{"kind":"Name","value":"interestRate"}},{"kind":"Field","name":{"kind":"Name","value":"minimumPayment"}},{"kind":"Field","name":{"kind":"Name","value":"targetExtraPayment"}},{"kind":"Field","name":{"kind":"Name","value":"payoffPriority"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastBalanceUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateLiabilityMutation, CreateLiabilityMutationVariables>;
export const UpdateLiabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLiability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLiabilityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLiability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LiabilityFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LiabilityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Liability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"liabilityType"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"originalLoanAmount"}},{"kind":"Field","name":{"kind":"Name","value":"interestRate"}},{"kind":"Field","name":{"kind":"Name","value":"minimumPayment"}},{"kind":"Field","name":{"kind":"Name","value":"targetExtraPayment"}},{"kind":"Field","name":{"kind":"Name","value":"payoffPriority"}},{"kind":"Field","name":{"kind":"Name","value":"contributionMode"}},{"kind":"Field","name":{"kind":"Name","value":"contributionValue"}},{"kind":"Field","name":{"kind":"Name","value":"personIds"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"lastBalanceUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateLiabilityMutation, UpdateLiabilityMutationVariables>;
export const DeleteAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAssetMutation, DeleteAssetMutationVariables>;
export const DeleteLiabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLiability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLiability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLiabilityMutation, DeleteLiabilityMutationVariables>;
export const LinkAssetToPlaidAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkAssetToPlaidAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plaidAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkAssetToPlaidAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"plaidAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plaidAccountId"}}}]}]}}]} as unknown as DocumentNode<LinkAssetToPlaidAccountMutation, LinkAssetToPlaidAccountMutationVariables>;
export const UnlinkAssetFromPlaidAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlinkAssetFromPlaidAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkAssetFromPlaidAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}}}]}]}}]} as unknown as DocumentNode<UnlinkAssetFromPlaidAccountMutation, UnlinkAssetFromPlaidAccountMutationVariables>;
export const LinkLiabilityToPlaidAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkLiabilityToPlaidAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"liabilityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plaidAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkLiabilityToPlaidAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"liabilityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"liabilityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"plaidAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plaidAccountId"}}}]}]}}]} as unknown as DocumentNode<LinkLiabilityToPlaidAccountMutation, LinkLiabilityToPlaidAccountMutationVariables>;
export const UnlinkLiabilityFromPlaidAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlinkLiabilityFromPlaidAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"liabilityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkLiabilityFromPlaidAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"liabilityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"liabilityId"}}}]}]}}]} as unknown as DocumentNode<UnlinkLiabilityFromPlaidAccountMutation, UnlinkLiabilityFromPlaidAccountMutationVariables>;
export const GetBudgetByDateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBudgetByDate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"budgetByDate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyIncome"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyExpenses"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetBudgetByDateQuery, GetBudgetByDateQueryVariables>;
export const CreateBudgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBudget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateBudgetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBudget"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyIncome"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyExpenses"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateBudgetMutation, CreateBudgetMutationVariables>;
export const CreateExpenseCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateExpenseCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateExpenseCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createExpenseCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExpenseCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"currentSpend"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateExpenseCategoryMutation, CreateExpenseCategoryMutationVariables>;
export const UpdateExpenseCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateExpenseCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateExpenseCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateExpenseCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExpenseCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"currentSpend"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateExpenseCategoryMutation, UpdateExpenseCategoryMutationVariables>;
export const DeleteExpenseCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteExpenseCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteExpenseCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteExpenseCategoryMutation, DeleteExpenseCategoryMutationVariables>;
export const GetCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"budgetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"expenseCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"budgetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"budgetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExpenseCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"currentSpend"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetCategoriesQuery, GetCategoriesQueryVariables>;
export const ExchangePlaidPublicTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExchangePlaidPublicToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publicToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exchangePlaidPublicToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"publicToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publicToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"institutionId"}},{"kind":"Field","name":{"kind":"Name","value":"institutionName"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ExchangePlaidPublicTokenMutation, ExchangePlaidPublicTokenMutationVariables>;
export const SyncPlaidConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncPlaidConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncPlaidConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<SyncPlaidConnectionMutation, SyncPlaidConnectionMutationVariables>;
export const DeletePlaidConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePlaidConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePlaidConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePlaidConnectionMutation, DeletePlaidConnectionMutationVariables>;
export const PlaidConnectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlaidConnections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plaidConnections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"institutionId"}},{"kind":"Field","name":{"kind":"Name","value":"institutionName"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<PlaidConnectionsQuery, PlaidConnectionsQueryVariables>;
export const PlaidAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlaidAccounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plaidAccounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"connectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"plaidConnectionId"}},{"kind":"Field","name":{"kind":"Name","value":"externalId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"officialName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"subtype"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"isoCurrencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PlaidAccountsQuery, PlaidAccountsQueryVariables>;
export const CreatePlaidLinkTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CreatePlaidLinkToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPlaidLinkToken"}}]}}]} as unknown as DocumentNode<CreatePlaidLinkTokenQuery, CreatePlaidLinkTokenQueryVariables>;
export const CreateExpenseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateExpense"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateExpenseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createExpense"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpenseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpenseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"splits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateExpenseMutation, CreateExpenseMutationVariables>;
export const UpdateExpenseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateExpense"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateExpenseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateExpense"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpenseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpenseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"splits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateExpenseMutation, UpdateExpenseMutationVariables>;
export const DeleteExpenseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteExpense"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteExpense"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteExpenseMutation, DeleteExpenseMutationVariables>;
export const GetExpensesByBudgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetExpensesByBudget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"budgetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"expenses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"budgetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"budgetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpenseFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpenseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"splits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetExpensesByBudgetQuery, GetExpensesByBudgetQueryVariables>;
export const GetGoalsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGoals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"goals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}},{"kind":"Field","name":{"kind":"Name","value":"targetDate"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"customCategory"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAccountIds"}},{"kind":"Field","name":{"kind":"Name","value":"isFinancialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"financialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetGoalsQuery, GetGoalsQueryVariables>;
export const CreateGoalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGoal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGoalInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGoal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}},{"kind":"Field","name":{"kind":"Name","value":"targetDate"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"customCategory"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAccountIds"}},{"kind":"Field","name":{"kind":"Name","value":"isFinancialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"financialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateGoalMutation, CreateGoalMutationVariables>;
export const UpdateGoalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGoal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGoalInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGoal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}},{"kind":"Field","name":{"kind":"Name","value":"targetDate"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"customCategory"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAccountIds"}},{"kind":"Field","name":{"kind":"Name","value":"isFinancialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"financialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateGoalMutation, UpdateGoalMutationVariables>;
export const DeleteGoalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGoal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGoal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGoalMutation, DeleteGoalMutationVariables>;
export const CreateFinancialOrderStepsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFinancialOrderSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFinancialOrderSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"targetAmount"}},{"kind":"Field","name":{"kind":"Name","value":"targetDate"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"customCategory"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAccountIds"}},{"kind":"Field","name":{"kind":"Name","value":"isFinancialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"financialOrderStep"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateFinancialOrderStepsMutation, CreateFinancialOrderStepsMutationVariables>;
export const CreateIncomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIncome"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateIncomeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createIncome"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IncomeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IncomeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Income"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceOccurrenceDate"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateIncomeMutation, CreateIncomeMutationVariables>;
export const UpdateIncomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateIncome"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateIncomeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateIncome"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IncomeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IncomeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Income"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceOccurrenceDate"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateIncomeMutation, UpdateIncomeMutationVariables>;
export const DeleteIncomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteIncome"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteIncome"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteIncomeMutation, DeleteIncomeMutationVariables>;
export const GetIncomesByBudgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetIncomesByBudget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"budgetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"incomes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"budgetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"budgetId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IncomeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IncomeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Income"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"budgetId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTemplateId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceOccurrenceDate"}},{"kind":"Field","name":{"kind":"Name","value":"generationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetIncomesByBudgetQuery, GetIncomesByBudgetQueryVariables>;
export const PaycheckDeductionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PaycheckDeductions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"personId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paycheckDeductions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"personId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"personId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"pretax"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"linkedAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PaycheckDeductionsQuery, PaycheckDeductionsQueryVariables>;
export const UpsertPaycheckDeductionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertPaycheckDeduction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertPaycheckDeductionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPaycheckDeduction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"pretax"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"linkedAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertPaycheckDeductionMutation, UpsertPaycheckDeductionMutationVariables>;
export const PaycheckDeductionsByUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PaycheckDeductionsByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paycheckDeductionsByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"pretax"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"linkedAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PaycheckDeductionsByUserQuery, PaycheckDeductionsByUserQueryVariables>;
export const DeletePaycheckDeductionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePaycheckDeduction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePaycheckDeduction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePaycheckDeductionMutation, DeletePaycheckDeductionMutationVariables>;
export const UpsertPlannerPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertPlannerPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertPlannerPersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPlannerPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"birthday"}},{"kind":"Field","name":{"kind":"Name","value":"retirementAge"}},{"kind":"Field","name":{"kind":"Name","value":"annualSalary"}},{"kind":"Field","name":{"kind":"Name","value":"bonusMode"}},{"kind":"Field","name":{"kind":"Name","value":"bonusFrequency"}},{"kind":"Field","name":{"kind":"Name","value":"annualBonus"}},{"kind":"Field","name":{"kind":"Name","value":"incomeGrowthRate"}},{"kind":"Field","name":{"kind":"Name","value":"payType"}},{"kind":"Field","name":{"kind":"Name","value":"payDay"}},{"kind":"Field","name":{"kind":"Name","value":"payCadence"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"expectedHoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpsertPlannerPersonMutation, UpsertPlannerPersonMutationVariables>;
export const DeletePlannerPersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePlannerPerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePlannerPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePlannerPersonMutation, DeletePlannerPersonMutationVariables>;
export const PlannerPeopleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlannerPeople"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plannerPeople"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"birthday"}},{"kind":"Field","name":{"kind":"Name","value":"retirementAge"}},{"kind":"Field","name":{"kind":"Name","value":"annualSalary"}},{"kind":"Field","name":{"kind":"Name","value":"bonusMode"}},{"kind":"Field","name":{"kind":"Name","value":"bonusFrequency"}},{"kind":"Field","name":{"kind":"Name","value":"annualBonus"}},{"kind":"Field","name":{"kind":"Name","value":"incomeGrowthRate"}},{"kind":"Field","name":{"kind":"Name","value":"payType"}},{"kind":"Field","name":{"kind":"Name","value":"payDay"}},{"kind":"Field","name":{"kind":"Name","value":"payCadence"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"expectedHoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PlannerPeopleQuery, PlannerPeopleQueryVariables>;
export const ContributionLimitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContributionLimits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taxYear"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contributionLimits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taxYear"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taxYear"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accountType"}},{"kind":"Field","name":{"kind":"Name","value":"taxYear"}},{"kind":"Field","name":{"kind":"Name","value":"annualLimit"}},{"kind":"Field","name":{"kind":"Name","value":"catchUpAge"}},{"kind":"Field","name":{"kind":"Name","value":"catchUpAmount"}},{"kind":"Field","name":{"kind":"Name","value":"familyAnnualLimit"}}]}}]}}]} as unknown as DocumentNode<ContributionLimitsQuery, ContributionLimitsQueryVariables>;
export const NetWorthSnapshotsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NetWorthSnapshots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"netWorthSnapshots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotDate"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalLiabilities"}},{"kind":"Field","name":{"kind":"Name","value":"netWorth"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<NetWorthSnapshotsQuery, NetWorthSnapshotsQueryVariables>;
export const CreateNetWorthSnapshotDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNetWorthSnapshot"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNetWorthSnapshotInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNetWorthSnapshot"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotDate"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalLiabilities"}},{"kind":"Field","name":{"kind":"Name","value":"netWorth"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateNetWorthSnapshotMutation, CreateNetWorthSnapshotMutationVariables>;
export const DeleteNetWorthSnapshotDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNetWorthSnapshot"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNetWorthSnapshot"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteNetWorthSnapshotMutation, DeleteNetWorthSnapshotMutationVariables>;
export const TransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Transactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"plaidAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"plaidTransactionId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"expenseCategoryId"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<TransactionsQuery, TransactionsQueryVariables>;
export const AssignTransactionCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignTransactionCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expenseCategoryId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignTransactionCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"expenseCategoryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expenseCategoryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"expenseCategoryId"}}]}}]}}]} as unknown as DocumentNode<AssignTransactionCategoryMutation, AssignTransactionCategoryMutationVariables>;
export const DeleteTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTransactionMutation, DeleteTransactionMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"identityProviderId"}},{"kind":"Field","name":{"kind":"Name","value":"inflationRate"}},{"kind":"Field","name":{"kind":"Name","value":"safeWithdrawalRate"}},{"kind":"Field","name":{"kind":"Name","value":"filingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"returnType"}},{"kind":"Field","name":{"kind":"Name","value":"currencyType"}},{"kind":"Field","name":{"kind":"Name","value":"deductionType"}},{"kind":"Field","name":{"kind":"Name","value":"deductionAmount"}},{"kind":"Field","name":{"kind":"Name","value":"payoffStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"maxTaxBracketId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const GetRecurringExpensesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRecurringExpenses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringExpenses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"recurrenceInterval"}},{"kind":"Field","name":{"kind":"Name","value":"paydayDayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetRecurringExpensesQuery, GetRecurringExpensesQueryVariables>;
export const GetRecurringIncomesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRecurringIncomes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringIncomes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"recurrenceInterval"}},{"kind":"Field","name":{"kind":"Name","value":"paydayDayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetRecurringIncomesQuery, GetRecurringIncomesQueryVariables>;
export const CreateRecurringIncomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRecurringIncome"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecurringIncomeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecurringIncome"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"recurrenceInterval"}},{"kind":"Field","name":{"kind":"Name","value":"paydayDayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateRecurringIncomeMutation, CreateRecurringIncomeMutationVariables>;
export const UpdateRecurringIncomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRecurringIncome"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecurringIncomeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecurringIncome"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"recurrenceInterval"}},{"kind":"Field","name":{"kind":"Name","value":"paydayDayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateRecurringIncomeMutation, UpdateRecurringIncomeMutationVariables>;
export const DeleteRecurringIncomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRecurringIncome"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecurringIncome"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRecurringIncomeMutation, DeleteRecurringIncomeMutationVariables>;
export const CreateRecurringExpenseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRecurringExpense"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecurringExpenseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecurringExpense"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"recurrenceInterval"}},{"kind":"Field","name":{"kind":"Name","value":"paydayDayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateRecurringExpenseMutation, CreateRecurringExpenseMutationVariables>;
export const UpdateRecurringExpenseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRecurringExpense"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecurringExpenseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecurringExpense"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"recurrenceInterval"}},{"kind":"Field","name":{"kind":"Name","value":"paydayDayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateRecurringExpenseMutation, UpdateRecurringExpenseMutationVariables>;
export const DeleteRecurringExpenseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRecurringExpense"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecurringExpense"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRecurringExpenseMutation, DeleteRecurringExpenseMutationVariables>;
export const RetirementAccessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RetirementAccess"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retirementAccess"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hsaReceipts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"incurredOn"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hsaReimbursements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"reimbursedOn"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hsaSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalReceipts"}},{"kind":"Field","name":{"kind":"Name","value":"totalReimbursed"}},{"kind":"Field","name":{"kind":"Name","value":"availableToReimburse"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rothConversions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"convertedOn"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"fromAssetId"}},{"kind":"Field","name":{"kind":"Name","value":"toAssetId"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rothBuckets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"availableOn"}},{"kind":"Field","name":{"kind":"Name","value":"accessible"}}]}}]}}]}}]} as unknown as DocumentNode<RetirementAccessQuery, RetirementAccessQueryVariables>;
export const CreateHsaReceiptDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHsaReceipt"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHsaReceiptInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createHsaReceipt"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"incurredOn"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateHsaReceiptMutation, CreateHsaReceiptMutationVariables>;
export const DeleteHsaReceiptDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteHsaReceipt"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteHsaReceipt"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteHsaReceiptMutation, DeleteHsaReceiptMutationVariables>;
export const CreateHsaReimbursementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHsaReimbursement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHsaReimbursementInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createHsaReimbursement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"reimbursedOn"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateHsaReimbursementMutation, CreateHsaReimbursementMutationVariables>;
export const DeleteHsaReimbursementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteHsaReimbursement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteHsaReimbursement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteHsaReimbursementMutation, DeleteHsaReimbursementMutationVariables>;
export const CreateRothConversionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRothConversion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRothConversionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRothConversion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"convertedOn"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"fromAssetId"}},{"kind":"Field","name":{"kind":"Name","value":"toAssetId"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateRothConversionMutation, CreateRothConversionMutationVariables>;
export const DeleteRothConversionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRothConversion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRothConversion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteRothConversionMutation, DeleteRothConversionMutationVariables>;
export const CalculateRetirementLadderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateRetirementLadder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"initialBalance"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"annualExpenses"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentAge"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"firstWithdrawalAge"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isRoth"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filingStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FilingStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"yearsToProject"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculateRetirementLadder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"initialBalance"},"value":{"kind":"Variable","name":{"kind":"Name","value":"initialBalance"}}},{"kind":"Argument","name":{"kind":"Name","value":"annualExpenses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"annualExpenses"}}},{"kind":"Argument","name":{"kind":"Name","value":"currentAge"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentAge"}}},{"kind":"Argument","name":{"kind":"Name","value":"firstWithdrawalAge"},"value":{"kind":"Variable","name":{"kind":"Name","value":"firstWithdrawalAge"}}},{"kind":"Argument","name":{"kind":"Name","value":"isRoth"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isRoth"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"filingStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filingStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"yearsToProject"},"value":{"kind":"Variable","name":{"kind":"Name","value":"yearsToProject"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initialBalance"}},{"kind":"Field","name":{"kind":"Name","value":"annualExpenses"}},{"kind":"Field","name":{"kind":"Name","value":"currentAge"}},{"kind":"Field","name":{"kind":"Name","value":"firstWithdrawalAge"}},{"kind":"Field","name":{"kind":"Name","value":"isRoth"}},{"kind":"Field","name":{"kind":"Name","value":"projectedSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"age"}},{"kind":"Field","name":{"kind":"Name","value":"withdrawalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"taxableWithdrawal"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedIncomeTax"}},{"kind":"Field","name":{"kind":"Name","value":"earlyWithdrawalPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"netWithdrawal"}},{"kind":"Field","name":{"kind":"Name","value":"remainingBalance"}},{"kind":"Field","name":{"kind":"Name","value":"isAccessible"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isSustainable"}},{"kind":"Field","name":{"kind":"Name","value":"projectedDepletionAge"}}]}}]}}]} as unknown as DocumentNode<CalculateRetirementLadderQuery, CalculateRetirementLadderQueryVariables>;
export const GetTaxYearDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTaxYearData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filingStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FilingStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taxYearData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filingStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filingStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"brackets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimumAmount"}},{"kind":"Field","name":{"kind":"Name","value":"maximumAmount"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"standardDeduction"}},{"kind":"Field","name":{"kind":"Name","value":"ssWageBase"}}]}}]}}]} as unknown as DocumentNode<GetTaxYearDataQuery, GetTaxYearDataQueryVariables>;
export const EstimateTaxesForYearDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EstimateTaxesForYear"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filingStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FilingStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"income"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deduction"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"estimateTaxesForYear"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"filingStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filingStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"income"},"value":{"kind":"Variable","name":{"kind":"Name","value":"income"}}},{"kind":"Argument","name":{"kind":"Name","value":"deduction"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deduction"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taxOwed"}},{"kind":"Field","name":{"kind":"Name","value":"taxableIncome"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveRate"}},{"kind":"Field","name":{"kind":"Name","value":"marginalRate"}}]}}]}}]} as unknown as DocumentNode<EstimateTaxesForYearQuery, EstimateTaxesForYearQueryVariables>;
export const CurrentUserPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentUserPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identityProviderId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"returnType"}},{"kind":"Field","name":{"kind":"Name","value":"safeWithdrawalRate"}},{"kind":"Field","name":{"kind":"Name","value":"currencyType"}},{"kind":"Field","name":{"kind":"Name","value":"inflationRate"}},{"kind":"Field","name":{"kind":"Name","value":"deductionType"}},{"kind":"Field","name":{"kind":"Name","value":"deductionAmount"}},{"kind":"Field","name":{"kind":"Name","value":"maxTaxBracketId"}},{"kind":"Field","name":{"kind":"Name","value":"filingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"payoffStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"budgetEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyExpenses"}},{"kind":"Field","name":{"kind":"Name","value":"setupCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"disclaimerAccepted"}},{"kind":"Field","name":{"kind":"Name","value":"disclaimerAcceptedAt"}}]}}]}}]} as unknown as DocumentNode<CurrentUserPreferencesQuery, CurrentUserPreferencesQueryVariables>;
export const UpdateUserSetupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserSetup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserSetupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserSetup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"budgetEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyExpenses"}},{"kind":"Field","name":{"kind":"Name","value":"setupCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"disclaimerAccepted"}},{"kind":"Field","name":{"kind":"Name","value":"disclaimerAcceptedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserSetupMutation, UpdateUserSetupMutationVariables>;
export const UpdateUserPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateUserPreferencesMutation, UpdateUserPreferencesMutationVariables>;
export const CreateUserPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUserPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateUserPreferencesMutation, CreateUserPreferencesMutationVariables>;