/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AssetFields on Asset {\n    id\n    userId\n    name\n    assetType\n    currentValue\n    contributionMode\n    contributionValue\n    employerMatchRate\n    employerMatchMaxPercentOfSalary\n    annualRate\n    returnProfile\n    taxTreatment\n    pretaxSharePercent\n    personIds\n    purchaseDate\n    purchasePrice\n    homeGrowthProfile\n    vehicleDepreciationProfile\n    linkedLiabilityId\n    plaidAccountId\n    lastValueUpdatedAt\n    createdAt\n    updatedAt\n  }\n": typeof types.AssetFieldsFragmentDoc,
    "\n  fragment LiabilityFields on Liability {\n    id\n    userId\n    name\n    liabilityType\n    currentBalance\n    originalLoanAmount\n    interestRate\n    minimumPayment\n    targetExtraPayment\n    payoffPriority\n    contributionMode\n    contributionValue\n    personIds\n    plaidAccountId\n    lastBalanceUpdatedAt\n    createdAt\n    updatedAt\n  }\n": typeof types.LiabilityFieldsFragmentDoc,
    "\n  query GetAssetsByUser {\n    assets {\n      ...AssetFields\n    }\n  }\n": typeof types.GetAssetsByUserDocument,
    "\n  query GetLiabilitiesByUser {\n    liabilities {\n      ...LiabilityFields\n    }\n  }\n": typeof types.GetLiabilitiesByUserDocument,
    "\n  mutation CreateAsset($input: CreateAssetInput!) {\n    createAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n": typeof types.CreateAssetDocument,
    "\n  mutation UpdateAsset($input: UpdateAssetInput!) {\n    updateAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n": typeof types.UpdateAssetDocument,
    "\n  mutation CreateLiability($input: CreateLiabilityInput!) {\n    createLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n": typeof types.CreateLiabilityDocument,
    "\n  mutation UpdateLiability($input: UpdateLiabilityInput!) {\n    updateLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n": typeof types.UpdateLiabilityDocument,
    "\n  mutation DeleteAsset($id: ID!) {\n    deleteAsset(id: $id)\n  }\n": typeof types.DeleteAssetDocument,
    "\n  mutation DeleteLiability($id: ID!) {\n    deleteLiability(id: $id)\n  }\n": typeof types.DeleteLiabilityDocument,
    "\n  mutation LinkAssetToPlaidAccount($assetId: ID!, $plaidAccountId: ID!) {\n    linkAssetToPlaidAccount(assetId: $assetId, plaidAccountId: $plaidAccountId)\n  }\n": typeof types.LinkAssetToPlaidAccountDocument,
    "\n  mutation UnlinkAssetFromPlaidAccount($assetId: ID!) {\n    unlinkAssetFromPlaidAccount(assetId: $assetId)\n  }\n": typeof types.UnlinkAssetFromPlaidAccountDocument,
    "\n  mutation LinkLiabilityToPlaidAccount($liabilityId: ID!, $plaidAccountId: ID!) {\n    linkLiabilityToPlaidAccount(liabilityId: $liabilityId, plaidAccountId: $plaidAccountId)\n  }\n": typeof types.LinkLiabilityToPlaidAccountDocument,
    "\n  mutation UnlinkLiabilityFromPlaidAccount($liabilityId: ID!) {\n    unlinkLiabilityFromPlaidAccount(liabilityId: $liabilityId)\n  }\n": typeof types.UnlinkLiabilityFromPlaidAccountDocument,
    "\n  query GetBudgetByDate($date: String!) {\n    budgetByDate(date: $date) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetBudgetByDateDocument,
    "\n  mutation CreateBudget($input: CreateBudgetInput!) {\n    createBudget(input: $input) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateBudgetDocument,
    "\n  fragment CategoryFields on ExpenseCategory {\n    id\n    userId\n    budgetId\n    name\n    allocation\n    currentSpend\n    sourceType\n    sourceTemplateId\n    generationMonth\n    createdAt\n    updatedAt\n  }\n": typeof types.CategoryFieldsFragmentDoc,
    "\n  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {\n    createExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n": typeof types.CreateExpenseCategoryDocument,
    "\n  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {\n    updateExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n": typeof types.UpdateExpenseCategoryDocument,
    "\n  mutation DeleteExpenseCategory($id: ID!) {\n    deleteExpenseCategory(id: $id)\n  }\n": typeof types.DeleteExpenseCategoryDocument,
    "\n  query GetCategories($budgetId: ID!) {\n    expenseCategories(budgetId: $budgetId) {\n      ...CategoryFields\n    }\n  }\n": typeof types.GetCategoriesDocument,
    "\n  mutation ExchangePlaidPublicToken($publicToken: String!) {\n    exchangePlaidPublicToken(publicToken: $publicToken) {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n": typeof types.ExchangePlaidPublicTokenDocument,
    "\n  mutation SyncPlaidConnection($id: ID!) {\n    syncPlaidConnection(id: $id)\n  }\n": typeof types.SyncPlaidConnectionDocument,
    "\n  mutation DeletePlaidConnection($id: ID!) {\n    deletePlaidConnection(id: $id)\n  }\n": typeof types.DeletePlaidConnectionDocument,
    "\n  query PlaidConnections {\n    plaidConnections {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n": typeof types.PlaidConnectionsDocument,
    "\n  query PlaidAccounts($connectionId: ID!) {\n    plaidAccounts(connectionId: $connectionId) {\n      id\n      plaidConnectionId\n      externalId\n      name\n      officialName\n      type\n      subtype\n      currentBalance\n      isoCurrencyCode\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PlaidAccountsDocument,
    "\n  query CreatePlaidLinkToken {\n    createPlaidLinkToken\n  }\n": typeof types.CreatePlaidLinkTokenDocument,
    "\n  fragment ExpenseFields on Expense {\n    id\n    userId\n    budgetId\n    amount\n    date\n    description\n    splits {\n      id\n      categoryId\n      amount\n      description\n    }\n    sourceType\n    sourceTemplateId\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n": typeof types.ExpenseFieldsFragmentDoc,
    "\n  mutation CreateExpense($input: CreateExpenseInput!) {\n    createExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n": typeof types.CreateExpenseDocument,
    "\n  mutation UpdateExpense($input: UpdateExpenseInput!) {\n    updateExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n": typeof types.UpdateExpenseDocument,
    "\n  mutation DeleteExpense($id: ID!) {\n    deleteExpense(id: $id)\n  }\n": typeof types.DeleteExpenseDocument,
    "\n  query GetExpensesByBudget($budgetId: ID!) {\n    expenses(budgetId: $budgetId) {\n      ...ExpenseFields\n    }\n  }\n": typeof types.GetExpensesByBudgetDocument,
    "\n  query GetGoals {\n    goals {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetGoalsDocument,
    "\n  mutation CreateGoal($input: CreateGoalInput!) {\n    createGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateGoalDocument,
    "\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateGoalDocument,
    "\n  mutation DeleteGoal($id: ID!) {\n    deleteGoal(id: $id)\n  }\n": typeof types.DeleteGoalDocument,
    "\n  mutation CreateFinancialOrderSteps {\n    createFinancialOrderSteps {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateFinancialOrderStepsDocument,
    "\n  fragment IncomeFields on Income {\n    id\n    userId\n    budgetId\n    name\n    amount\n    date\n    sourceType\n    sourceTemplateId\n    sourceOccurrenceDate\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n": typeof types.IncomeFieldsFragmentDoc,
    "\n  mutation CreateIncome($input: CreateIncomeInput!) {\n    createIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n": typeof types.CreateIncomeDocument,
    "\n  mutation UpdateIncome($input: UpdateIncomeInput!) {\n    updateIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n": typeof types.UpdateIncomeDocument,
    "\n  mutation DeleteIncome($id: ID!) {\n    deleteIncome(id: $id)\n  }\n": typeof types.DeleteIncomeDocument,
    "\n  query GetIncomesByBudget($budgetId: ID!) {\n    incomes(budgetId: $budgetId) {\n      ...IncomeFields\n    }\n  }\n": typeof types.GetIncomesByBudgetDocument,
    "\n  query PaycheckDeductions($personId: ID!) {\n    paycheckDeductions(personId: $personId) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PaycheckDeductionsDocument,
    "\n  mutation UpsertPaycheckDeduction($input: UpsertPaycheckDeductionInput!) {\n    upsertPaycheckDeduction(input: $input) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpsertPaycheckDeductionDocument,
    "\n  query PaycheckDeductionsByUser {\n    paycheckDeductionsByUser {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PaycheckDeductionsByUserDocument,
    "\n  mutation DeletePaycheckDeduction($id: ID!) {\n    deletePaycheckDeduction(id: $id)\n  }\n": typeof types.DeletePaycheckDeductionDocument,
    "\n  mutation UpsertPlannerPerson($input: UpsertPlannerPersonInput!) {\n    upsertPlannerPerson(input: $input) {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpsertPlannerPersonDocument,
    "\n  mutation DeletePlannerPerson($id: ID!) {\n    deletePlannerPerson(id: $id)\n  }\n": typeof types.DeletePlannerPersonDocument,
    "\n  query PlannerPeople {\n    plannerPeople {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PlannerPeopleDocument,
    "\n  query ContributionLimits($taxYear: Int!) {\n    contributionLimits(taxYear: $taxYear) {\n      id\n      accountType\n      taxYear\n      annualLimit\n      catchUpAge\n      catchUpAmount\n      familyAnnualLimit\n    }\n  }\n": typeof types.ContributionLimitsDocument,
    "\n  query NetWorthSnapshots {\n    netWorthSnapshots {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.NetWorthSnapshotsDocument,
    "\n  mutation CreateNetWorthSnapshot($input: CreateNetWorthSnapshotInput!) {\n    createNetWorthSnapshot(input: $input) {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateNetWorthSnapshotDocument,
    "\n  mutation DeleteNetWorthSnapshot($id: ID!) {\n    deleteNetWorthSnapshot(id: $id)\n  }\n": typeof types.DeleteNetWorthSnapshotDocument,
    "\n  query Transactions($fromDate: String, $toDate: String) {\n    transactions(fromDate: $fromDate, toDate: $toDate) {\n      id\n      userId\n      plaidAccountId\n      plaidTransactionId\n      date\n      amount\n      name\n      expenseCategoryId\n      pending\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.TransactionsDocument,
    "\n  mutation AssignTransactionCategory($id: ID!, $expenseCategoryId: ID) {\n    assignTransactionCategory(id: $id, expenseCategoryId: $expenseCategoryId) {\n      id\n      expenseCategoryId\n    }\n  }\n": typeof types.AssignTransactionCategoryDocument,
    "\n  mutation DeleteTransaction($id: ID!) {\n    deleteTransaction(id: $id)\n  }\n": typeof types.DeleteTransactionDocument,
    "\n  query Me {\n    me {\n      id\n      email\n      identityProviderId\n      inflationRate\n      safeWithdrawalRate\n      filingStatus\n      returnType\n      currencyType\n      deductionType\n      deductionAmount\n      payoffStrategy\n      maxTaxBracketId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.MeDocument,
    "\n  query GetRecurringExpenses {\n    recurringExpenses {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetRecurringExpensesDocument,
    "\n  query GetRecurringIncomes {\n    recurringIncomes {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetRecurringIncomesDocument,
    "\n  mutation CreateRecurringIncome($input: CreateRecurringIncomeInput!) {\n    createRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateRecurringIncomeDocument,
    "\n  mutation UpdateRecurringIncome($input: UpdateRecurringIncomeInput!) {\n    updateRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateRecurringIncomeDocument,
    "\n  mutation DeleteRecurringIncome($id: ID!) {\n    deleteRecurringIncome(id: $id)\n  }\n": typeof types.DeleteRecurringIncomeDocument,
    "\n  mutation CreateRecurringExpense($input: CreateRecurringExpenseInput!) {\n    createRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateRecurringExpenseDocument,
    "\n  mutation UpdateRecurringExpense($input: UpdateRecurringExpenseInput!) {\n    updateRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateRecurringExpenseDocument,
    "\n  mutation DeleteRecurringExpense($id: ID!) {\n    deleteRecurringExpense(id: $id)\n  }\n": typeof types.DeleteRecurringExpenseDocument,
    "\n  query RetirementAccess {\n    retirementAccess {\n      hsaReceipts {\n        id\n        userId\n        incurredOn\n        description\n        amount\n        createdAt\n        updatedAt\n      }\n      hsaReimbursements {\n        id\n        userId\n        reimbursedOn\n        amount\n        note\n        createdAt\n        updatedAt\n      }\n      hsaSummary {\n        totalReceipts\n        totalReimbursed\n        availableToReimburse\n      }\n      rothConversions {\n        id\n        userId\n        convertedOn\n        amount\n        fromAssetId\n        toAssetId\n        note\n        createdAt\n        updatedAt\n      }\n      rothBuckets {\n        year\n        amount\n        availableOn\n        accessible\n      }\n    }\n  }\n": typeof types.RetirementAccessDocument,
    "\n  mutation CreateHsaReceipt($input: CreateHsaReceiptInput!) {\n    createHsaReceipt(input: $input) {\n      id\n      userId\n      incurredOn\n      description\n      amount\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateHsaReceiptDocument,
    "\n  mutation DeleteHsaReceipt($id: ID!) {\n    deleteHsaReceipt(id: $id)\n  }\n": typeof types.DeleteHsaReceiptDocument,
    "\n  mutation CreateHsaReimbursement($input: CreateHsaReimbursementInput!) {\n    createHsaReimbursement(input: $input) {\n      id\n      userId\n      reimbursedOn\n      amount\n      note\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateHsaReimbursementDocument,
    "\n  mutation DeleteHsaReimbursement($id: ID!) {\n    deleteHsaReimbursement(id: $id)\n  }\n": typeof types.DeleteHsaReimbursementDocument,
    "\n  mutation CreateRothConversion($input: CreateRothConversionInput!) {\n    createRothConversion(input: $input) {\n      id\n      userId\n      convertedOn\n      amount\n      fromAssetId\n      toAssetId\n      note\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateRothConversionDocument,
    "\n  mutation DeleteRothConversion($id: ID!) {\n    deleteRothConversion(id: $id)\n  }\n": typeof types.DeleteRothConversionDocument,
    "\n  query CalculateRetirementLadder(\n    $initialBalance: String!\n    $annualExpenses: String!\n    $currentAge: Int!\n    $firstWithdrawalAge: Int!\n    $isRoth: Boolean!\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $yearsToProject: Int\n  ) {\n    calculateRetirementLadder(\n      initialBalance: $initialBalance\n      annualExpenses: $annualExpenses\n      currentAge: $currentAge\n      firstWithdrawalAge: $firstWithdrawalAge\n      isRoth: $isRoth\n      year: $year\n      filingStatus: $filingStatus\n      yearsToProject: $yearsToProject\n    ) {\n      initialBalance\n      annualExpenses\n      currentAge\n      firstWithdrawalAge\n      isRoth\n      projectedSteps {\n        year\n        age\n        withdrawalAmount\n        taxableWithdrawal\n        estimatedIncomeTax\n        earlyWithdrawalPenalty\n        netWithdrawal\n        remainingBalance\n        isAccessible\n      }\n      isSustainable\n      projectedDepletionAge\n    }\n  }\n": typeof types.CalculateRetirementLadderDocument,
    "\n  query GetTaxYearData($filingStatus: FilingStatus!) {\n    taxYearData(filingStatus: $filingStatus) {\n      year\n      brackets {\n        minimumAmount\n        maximumAmount\n        rate\n      }\n      standardDeduction\n      ssWageBase\n    }\n  }\n": typeof types.GetTaxYearDataDocument,
    "\n  query EstimateTaxesForYear(\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $income: String!\n    $deduction: String\n  ) {\n    estimateTaxesForYear(\n      year: $year\n      filingStatus: $filingStatus\n      income: $income\n      deduction: $deduction\n    ) {\n      taxOwed\n      taxableIncome\n      effectiveRate\n      marginalRate\n    }\n  }\n": typeof types.EstimateTaxesForYearDocument,
    "\n  query CurrentUserPreferences {\n    me {\n      id\n      identityProviderId\n      email\n      returnType\n      safeWithdrawalRate\n      currencyType\n      inflationRate\n      deductionType\n      deductionAmount\n      maxTaxBracketId\n      filingStatus\n      payoffStrategy\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n": typeof types.CurrentUserPreferencesDocument,
    "\n  mutation UpdateUserSetup($input: UpdateUserSetupInput!) {\n    updateUserSetup(input: $input) {\n      id\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n": typeof types.UpdateUserSetupDocument,
    "\n  mutation UpdateUserPreferences($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateUserPreferencesDocument,
    "\n  mutation CreateUserPreferences($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateUserPreferencesDocument,
};
const documents: Documents = {
    "\n  fragment AssetFields on Asset {\n    id\n    userId\n    name\n    assetType\n    currentValue\n    contributionMode\n    contributionValue\n    employerMatchRate\n    employerMatchMaxPercentOfSalary\n    annualRate\n    returnProfile\n    taxTreatment\n    pretaxSharePercent\n    personIds\n    purchaseDate\n    purchasePrice\n    homeGrowthProfile\n    vehicleDepreciationProfile\n    linkedLiabilityId\n    plaidAccountId\n    lastValueUpdatedAt\n    createdAt\n    updatedAt\n  }\n": types.AssetFieldsFragmentDoc,
    "\n  fragment LiabilityFields on Liability {\n    id\n    userId\n    name\n    liabilityType\n    currentBalance\n    originalLoanAmount\n    interestRate\n    minimumPayment\n    targetExtraPayment\n    payoffPriority\n    contributionMode\n    contributionValue\n    personIds\n    plaidAccountId\n    lastBalanceUpdatedAt\n    createdAt\n    updatedAt\n  }\n": types.LiabilityFieldsFragmentDoc,
    "\n  query GetAssetsByUser {\n    assets {\n      ...AssetFields\n    }\n  }\n": types.GetAssetsByUserDocument,
    "\n  query GetLiabilitiesByUser {\n    liabilities {\n      ...LiabilityFields\n    }\n  }\n": types.GetLiabilitiesByUserDocument,
    "\n  mutation CreateAsset($input: CreateAssetInput!) {\n    createAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n": types.CreateAssetDocument,
    "\n  mutation UpdateAsset($input: UpdateAssetInput!) {\n    updateAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n": types.UpdateAssetDocument,
    "\n  mutation CreateLiability($input: CreateLiabilityInput!) {\n    createLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n": types.CreateLiabilityDocument,
    "\n  mutation UpdateLiability($input: UpdateLiabilityInput!) {\n    updateLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n": types.UpdateLiabilityDocument,
    "\n  mutation DeleteAsset($id: ID!) {\n    deleteAsset(id: $id)\n  }\n": types.DeleteAssetDocument,
    "\n  mutation DeleteLiability($id: ID!) {\n    deleteLiability(id: $id)\n  }\n": types.DeleteLiabilityDocument,
    "\n  mutation LinkAssetToPlaidAccount($assetId: ID!, $plaidAccountId: ID!) {\n    linkAssetToPlaidAccount(assetId: $assetId, plaidAccountId: $plaidAccountId)\n  }\n": types.LinkAssetToPlaidAccountDocument,
    "\n  mutation UnlinkAssetFromPlaidAccount($assetId: ID!) {\n    unlinkAssetFromPlaidAccount(assetId: $assetId)\n  }\n": types.UnlinkAssetFromPlaidAccountDocument,
    "\n  mutation LinkLiabilityToPlaidAccount($liabilityId: ID!, $plaidAccountId: ID!) {\n    linkLiabilityToPlaidAccount(liabilityId: $liabilityId, plaidAccountId: $plaidAccountId)\n  }\n": types.LinkLiabilityToPlaidAccountDocument,
    "\n  mutation UnlinkLiabilityFromPlaidAccount($liabilityId: ID!) {\n    unlinkLiabilityFromPlaidAccount(liabilityId: $liabilityId)\n  }\n": types.UnlinkLiabilityFromPlaidAccountDocument,
    "\n  query GetBudgetByDate($date: String!) {\n    budgetByDate(date: $date) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetBudgetByDateDocument,
    "\n  mutation CreateBudget($input: CreateBudgetInput!) {\n    createBudget(input: $input) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateBudgetDocument,
    "\n  fragment CategoryFields on ExpenseCategory {\n    id\n    userId\n    budgetId\n    name\n    allocation\n    currentSpend\n    sourceType\n    sourceTemplateId\n    generationMonth\n    createdAt\n    updatedAt\n  }\n": types.CategoryFieldsFragmentDoc,
    "\n  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {\n    createExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n": types.CreateExpenseCategoryDocument,
    "\n  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {\n    updateExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n": types.UpdateExpenseCategoryDocument,
    "\n  mutation DeleteExpenseCategory($id: ID!) {\n    deleteExpenseCategory(id: $id)\n  }\n": types.DeleteExpenseCategoryDocument,
    "\n  query GetCategories($budgetId: ID!) {\n    expenseCategories(budgetId: $budgetId) {\n      ...CategoryFields\n    }\n  }\n": types.GetCategoriesDocument,
    "\n  mutation ExchangePlaidPublicToken($publicToken: String!) {\n    exchangePlaidPublicToken(publicToken: $publicToken) {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n": types.ExchangePlaidPublicTokenDocument,
    "\n  mutation SyncPlaidConnection($id: ID!) {\n    syncPlaidConnection(id: $id)\n  }\n": types.SyncPlaidConnectionDocument,
    "\n  mutation DeletePlaidConnection($id: ID!) {\n    deletePlaidConnection(id: $id)\n  }\n": types.DeletePlaidConnectionDocument,
    "\n  query PlaidConnections {\n    plaidConnections {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n": types.PlaidConnectionsDocument,
    "\n  query PlaidAccounts($connectionId: ID!) {\n    plaidAccounts(connectionId: $connectionId) {\n      id\n      plaidConnectionId\n      externalId\n      name\n      officialName\n      type\n      subtype\n      currentBalance\n      isoCurrencyCode\n      createdAt\n      updatedAt\n    }\n  }\n": types.PlaidAccountsDocument,
    "\n  query CreatePlaidLinkToken {\n    createPlaidLinkToken\n  }\n": types.CreatePlaidLinkTokenDocument,
    "\n  fragment ExpenseFields on Expense {\n    id\n    userId\n    budgetId\n    amount\n    date\n    description\n    splits {\n      id\n      categoryId\n      amount\n      description\n    }\n    sourceType\n    sourceTemplateId\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n": types.ExpenseFieldsFragmentDoc,
    "\n  mutation CreateExpense($input: CreateExpenseInput!) {\n    createExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n": types.CreateExpenseDocument,
    "\n  mutation UpdateExpense($input: UpdateExpenseInput!) {\n    updateExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n": types.UpdateExpenseDocument,
    "\n  mutation DeleteExpense($id: ID!) {\n    deleteExpense(id: $id)\n  }\n": types.DeleteExpenseDocument,
    "\n  query GetExpensesByBudget($budgetId: ID!) {\n    expenses(budgetId: $budgetId) {\n      ...ExpenseFields\n    }\n  }\n": types.GetExpensesByBudgetDocument,
    "\n  query GetGoals {\n    goals {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetGoalsDocument,
    "\n  mutation CreateGoal($input: CreateGoalInput!) {\n    createGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateGoalDocument,
    "\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateGoalDocument,
    "\n  mutation DeleteGoal($id: ID!) {\n    deleteGoal(id: $id)\n  }\n": types.DeleteGoalDocument,
    "\n  mutation CreateFinancialOrderSteps {\n    createFinancialOrderSteps {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateFinancialOrderStepsDocument,
    "\n  fragment IncomeFields on Income {\n    id\n    userId\n    budgetId\n    name\n    amount\n    date\n    sourceType\n    sourceTemplateId\n    sourceOccurrenceDate\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n": types.IncomeFieldsFragmentDoc,
    "\n  mutation CreateIncome($input: CreateIncomeInput!) {\n    createIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n": types.CreateIncomeDocument,
    "\n  mutation UpdateIncome($input: UpdateIncomeInput!) {\n    updateIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n": types.UpdateIncomeDocument,
    "\n  mutation DeleteIncome($id: ID!) {\n    deleteIncome(id: $id)\n  }\n": types.DeleteIncomeDocument,
    "\n  query GetIncomesByBudget($budgetId: ID!) {\n    incomes(budgetId: $budgetId) {\n      ...IncomeFields\n    }\n  }\n": types.GetIncomesByBudgetDocument,
    "\n  query PaycheckDeductions($personId: ID!) {\n    paycheckDeductions(personId: $personId) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n": types.PaycheckDeductionsDocument,
    "\n  mutation UpsertPaycheckDeduction($input: UpsertPaycheckDeductionInput!) {\n    upsertPaycheckDeduction(input: $input) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpsertPaycheckDeductionDocument,
    "\n  query PaycheckDeductionsByUser {\n    paycheckDeductionsByUser {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n": types.PaycheckDeductionsByUserDocument,
    "\n  mutation DeletePaycheckDeduction($id: ID!) {\n    deletePaycheckDeduction(id: $id)\n  }\n": types.DeletePaycheckDeductionDocument,
    "\n  mutation UpsertPlannerPerson($input: UpsertPlannerPersonInput!) {\n    upsertPlannerPerson(input: $input) {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpsertPlannerPersonDocument,
    "\n  mutation DeletePlannerPerson($id: ID!) {\n    deletePlannerPerson(id: $id)\n  }\n": types.DeletePlannerPersonDocument,
    "\n  query PlannerPeople {\n    plannerPeople {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n": types.PlannerPeopleDocument,
    "\n  query ContributionLimits($taxYear: Int!) {\n    contributionLimits(taxYear: $taxYear) {\n      id\n      accountType\n      taxYear\n      annualLimit\n      catchUpAge\n      catchUpAmount\n      familyAnnualLimit\n    }\n  }\n": types.ContributionLimitsDocument,
    "\n  query NetWorthSnapshots {\n    netWorthSnapshots {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": types.NetWorthSnapshotsDocument,
    "\n  mutation CreateNetWorthSnapshot($input: CreateNetWorthSnapshotInput!) {\n    createNetWorthSnapshot(input: $input) {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateNetWorthSnapshotDocument,
    "\n  mutation DeleteNetWorthSnapshot($id: ID!) {\n    deleteNetWorthSnapshot(id: $id)\n  }\n": types.DeleteNetWorthSnapshotDocument,
    "\n  query Transactions($fromDate: String, $toDate: String) {\n    transactions(fromDate: $fromDate, toDate: $toDate) {\n      id\n      userId\n      plaidAccountId\n      plaidTransactionId\n      date\n      amount\n      name\n      expenseCategoryId\n      pending\n      createdAt\n      updatedAt\n    }\n  }\n": types.TransactionsDocument,
    "\n  mutation AssignTransactionCategory($id: ID!, $expenseCategoryId: ID) {\n    assignTransactionCategory(id: $id, expenseCategoryId: $expenseCategoryId) {\n      id\n      expenseCategoryId\n    }\n  }\n": types.AssignTransactionCategoryDocument,
    "\n  mutation DeleteTransaction($id: ID!) {\n    deleteTransaction(id: $id)\n  }\n": types.DeleteTransactionDocument,
    "\n  query Me {\n    me {\n      id\n      email\n      identityProviderId\n      inflationRate\n      safeWithdrawalRate\n      filingStatus\n      returnType\n      currencyType\n      deductionType\n      deductionAmount\n      payoffStrategy\n      maxTaxBracketId\n      createdAt\n      updatedAt\n    }\n  }\n": types.MeDocument,
    "\n  query GetRecurringExpenses {\n    recurringExpenses {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetRecurringExpensesDocument,
    "\n  query GetRecurringIncomes {\n    recurringIncomes {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetRecurringIncomesDocument,
    "\n  mutation CreateRecurringIncome($input: CreateRecurringIncomeInput!) {\n    createRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateRecurringIncomeDocument,
    "\n  mutation UpdateRecurringIncome($input: UpdateRecurringIncomeInput!) {\n    updateRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateRecurringIncomeDocument,
    "\n  mutation DeleteRecurringIncome($id: ID!) {\n    deleteRecurringIncome(id: $id)\n  }\n": types.DeleteRecurringIncomeDocument,
    "\n  mutation CreateRecurringExpense($input: CreateRecurringExpenseInput!) {\n    createRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateRecurringExpenseDocument,
    "\n  mutation UpdateRecurringExpense($input: UpdateRecurringExpenseInput!) {\n    updateRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateRecurringExpenseDocument,
    "\n  mutation DeleteRecurringExpense($id: ID!) {\n    deleteRecurringExpense(id: $id)\n  }\n": types.DeleteRecurringExpenseDocument,
    "\n  query RetirementAccess {\n    retirementAccess {\n      hsaReceipts {\n        id\n        userId\n        incurredOn\n        description\n        amount\n        createdAt\n        updatedAt\n      }\n      hsaReimbursements {\n        id\n        userId\n        reimbursedOn\n        amount\n        note\n        createdAt\n        updatedAt\n      }\n      hsaSummary {\n        totalReceipts\n        totalReimbursed\n        availableToReimburse\n      }\n      rothConversions {\n        id\n        userId\n        convertedOn\n        amount\n        fromAssetId\n        toAssetId\n        note\n        createdAt\n        updatedAt\n      }\n      rothBuckets {\n        year\n        amount\n        availableOn\n        accessible\n      }\n    }\n  }\n": types.RetirementAccessDocument,
    "\n  mutation CreateHsaReceipt($input: CreateHsaReceiptInput!) {\n    createHsaReceipt(input: $input) {\n      id\n      userId\n      incurredOn\n      description\n      amount\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateHsaReceiptDocument,
    "\n  mutation DeleteHsaReceipt($id: ID!) {\n    deleteHsaReceipt(id: $id)\n  }\n": types.DeleteHsaReceiptDocument,
    "\n  mutation CreateHsaReimbursement($input: CreateHsaReimbursementInput!) {\n    createHsaReimbursement(input: $input) {\n      id\n      userId\n      reimbursedOn\n      amount\n      note\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateHsaReimbursementDocument,
    "\n  mutation DeleteHsaReimbursement($id: ID!) {\n    deleteHsaReimbursement(id: $id)\n  }\n": types.DeleteHsaReimbursementDocument,
    "\n  mutation CreateRothConversion($input: CreateRothConversionInput!) {\n    createRothConversion(input: $input) {\n      id\n      userId\n      convertedOn\n      amount\n      fromAssetId\n      toAssetId\n      note\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateRothConversionDocument,
    "\n  mutation DeleteRothConversion($id: ID!) {\n    deleteRothConversion(id: $id)\n  }\n": types.DeleteRothConversionDocument,
    "\n  query CalculateRetirementLadder(\n    $initialBalance: String!\n    $annualExpenses: String!\n    $currentAge: Int!\n    $firstWithdrawalAge: Int!\n    $isRoth: Boolean!\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $yearsToProject: Int\n  ) {\n    calculateRetirementLadder(\n      initialBalance: $initialBalance\n      annualExpenses: $annualExpenses\n      currentAge: $currentAge\n      firstWithdrawalAge: $firstWithdrawalAge\n      isRoth: $isRoth\n      year: $year\n      filingStatus: $filingStatus\n      yearsToProject: $yearsToProject\n    ) {\n      initialBalance\n      annualExpenses\n      currentAge\n      firstWithdrawalAge\n      isRoth\n      projectedSteps {\n        year\n        age\n        withdrawalAmount\n        taxableWithdrawal\n        estimatedIncomeTax\n        earlyWithdrawalPenalty\n        netWithdrawal\n        remainingBalance\n        isAccessible\n      }\n      isSustainable\n      projectedDepletionAge\n    }\n  }\n": types.CalculateRetirementLadderDocument,
    "\n  query GetTaxYearData($filingStatus: FilingStatus!) {\n    taxYearData(filingStatus: $filingStatus) {\n      year\n      brackets {\n        minimumAmount\n        maximumAmount\n        rate\n      }\n      standardDeduction\n      ssWageBase\n    }\n  }\n": types.GetTaxYearDataDocument,
    "\n  query EstimateTaxesForYear(\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $income: String!\n    $deduction: String\n  ) {\n    estimateTaxesForYear(\n      year: $year\n      filingStatus: $filingStatus\n      income: $income\n      deduction: $deduction\n    ) {\n      taxOwed\n      taxableIncome\n      effectiveRate\n      marginalRate\n    }\n  }\n": types.EstimateTaxesForYearDocument,
    "\n  query CurrentUserPreferences {\n    me {\n      id\n      identityProviderId\n      email\n      returnType\n      safeWithdrawalRate\n      currencyType\n      inflationRate\n      deductionType\n      deductionAmount\n      maxTaxBracketId\n      filingStatus\n      payoffStrategy\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n": types.CurrentUserPreferencesDocument,
    "\n  mutation UpdateUserSetup($input: UpdateUserSetupInput!) {\n    updateUserSetup(input: $input) {\n      id\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n": types.UpdateUserSetupDocument,
    "\n  mutation UpdateUserPreferences($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n    }\n  }\n": types.UpdateUserPreferencesDocument,
    "\n  mutation CreateUserPreferences($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n    }\n  }\n": types.CreateUserPreferencesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AssetFields on Asset {\n    id\n    userId\n    name\n    assetType\n    currentValue\n    contributionMode\n    contributionValue\n    employerMatchRate\n    employerMatchMaxPercentOfSalary\n    annualRate\n    returnProfile\n    taxTreatment\n    pretaxSharePercent\n    personIds\n    purchaseDate\n    purchasePrice\n    homeGrowthProfile\n    vehicleDepreciationProfile\n    linkedLiabilityId\n    plaidAccountId\n    lastValueUpdatedAt\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment AssetFields on Asset {\n    id\n    userId\n    name\n    assetType\n    currentValue\n    contributionMode\n    contributionValue\n    employerMatchRate\n    employerMatchMaxPercentOfSalary\n    annualRate\n    returnProfile\n    taxTreatment\n    pretaxSharePercent\n    personIds\n    purchaseDate\n    purchasePrice\n    homeGrowthProfile\n    vehicleDepreciationProfile\n    linkedLiabilityId\n    plaidAccountId\n    lastValueUpdatedAt\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment LiabilityFields on Liability {\n    id\n    userId\n    name\n    liabilityType\n    currentBalance\n    originalLoanAmount\n    interestRate\n    minimumPayment\n    targetExtraPayment\n    payoffPriority\n    contributionMode\n    contributionValue\n    personIds\n    plaidAccountId\n    lastBalanceUpdatedAt\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment LiabilityFields on Liability {\n    id\n    userId\n    name\n    liabilityType\n    currentBalance\n    originalLoanAmount\n    interestRate\n    minimumPayment\n    targetExtraPayment\n    payoffPriority\n    contributionMode\n    contributionValue\n    personIds\n    plaidAccountId\n    lastBalanceUpdatedAt\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAssetsByUser {\n    assets {\n      ...AssetFields\n    }\n  }\n"): (typeof documents)["\n  query GetAssetsByUser {\n    assets {\n      ...AssetFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetLiabilitiesByUser {\n    liabilities {\n      ...LiabilityFields\n    }\n  }\n"): (typeof documents)["\n  query GetLiabilitiesByUser {\n    liabilities {\n      ...LiabilityFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAsset($input: CreateAssetInput!) {\n    createAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAsset($input: CreateAssetInput!) {\n    createAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAsset($input: UpdateAssetInput!) {\n    updateAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAsset($input: UpdateAssetInput!) {\n    updateAsset(input: $input) {\n      ...AssetFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateLiability($input: CreateLiabilityInput!) {\n    createLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateLiability($input: CreateLiabilityInput!) {\n    createLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateLiability($input: UpdateLiabilityInput!) {\n    updateLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateLiability($input: UpdateLiabilityInput!) {\n    updateLiability(input: $input) {\n      ...LiabilityFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAsset($id: ID!) {\n    deleteAsset(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAsset($id: ID!) {\n    deleteAsset(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteLiability($id: ID!) {\n    deleteLiability(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteLiability($id: ID!) {\n    deleteLiability(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LinkAssetToPlaidAccount($assetId: ID!, $plaidAccountId: ID!) {\n    linkAssetToPlaidAccount(assetId: $assetId, plaidAccountId: $plaidAccountId)\n  }\n"): (typeof documents)["\n  mutation LinkAssetToPlaidAccount($assetId: ID!, $plaidAccountId: ID!) {\n    linkAssetToPlaidAccount(assetId: $assetId, plaidAccountId: $plaidAccountId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnlinkAssetFromPlaidAccount($assetId: ID!) {\n    unlinkAssetFromPlaidAccount(assetId: $assetId)\n  }\n"): (typeof documents)["\n  mutation UnlinkAssetFromPlaidAccount($assetId: ID!) {\n    unlinkAssetFromPlaidAccount(assetId: $assetId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LinkLiabilityToPlaidAccount($liabilityId: ID!, $plaidAccountId: ID!) {\n    linkLiabilityToPlaidAccount(liabilityId: $liabilityId, plaidAccountId: $plaidAccountId)\n  }\n"): (typeof documents)["\n  mutation LinkLiabilityToPlaidAccount($liabilityId: ID!, $plaidAccountId: ID!) {\n    linkLiabilityToPlaidAccount(liabilityId: $liabilityId, plaidAccountId: $plaidAccountId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnlinkLiabilityFromPlaidAccount($liabilityId: ID!) {\n    unlinkLiabilityFromPlaidAccount(liabilityId: $liabilityId)\n  }\n"): (typeof documents)["\n  mutation UnlinkLiabilityFromPlaidAccount($liabilityId: ID!) {\n    unlinkLiabilityFromPlaidAccount(liabilityId: $liabilityId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetBudgetByDate($date: String!) {\n    budgetByDate(date: $date) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetBudgetByDate($date: String!) {\n    budgetByDate(date: $date) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateBudget($input: CreateBudgetInput!) {\n    createBudget(input: $input) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateBudget($input: CreateBudgetInput!) {\n    createBudget(input: $input) {\n      id\n      userId\n      date\n      monthlyIncome\n      monthlyExpenses\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CategoryFields on ExpenseCategory {\n    id\n    userId\n    budgetId\n    name\n    allocation\n    currentSpend\n    sourceType\n    sourceTemplateId\n    generationMonth\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment CategoryFields on ExpenseCategory {\n    id\n    userId\n    budgetId\n    name\n    allocation\n    currentSpend\n    sourceType\n    sourceTemplateId\n    generationMonth\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {\n    createExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {\n    createExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {\n    updateExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {\n    updateExpenseCategory(input: $input) {\n      ...CategoryFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteExpenseCategory($id: ID!) {\n    deleteExpenseCategory(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteExpenseCategory($id: ID!) {\n    deleteExpenseCategory(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCategories($budgetId: ID!) {\n    expenseCategories(budgetId: $budgetId) {\n      ...CategoryFields\n    }\n  }\n"): (typeof documents)["\n  query GetCategories($budgetId: ID!) {\n    expenseCategories(budgetId: $budgetId) {\n      ...CategoryFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ExchangePlaidPublicToken($publicToken: String!) {\n    exchangePlaidPublicToken(publicToken: $publicToken) {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation ExchangePlaidPublicToken($publicToken: String!) {\n    exchangePlaidPublicToken(publicToken: $publicToken) {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SyncPlaidConnection($id: ID!) {\n    syncPlaidConnection(id: $id)\n  }\n"): (typeof documents)["\n  mutation SyncPlaidConnection($id: ID!) {\n    syncPlaidConnection(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePlaidConnection($id: ID!) {\n    deletePlaidConnection(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePlaidConnection($id: ID!) {\n    deletePlaidConnection(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PlaidConnections {\n    plaidConnections {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query PlaidConnections {\n    plaidConnections {\n      id\n      userId\n      environment\n      itemId\n      institutionId\n      institutionName\n      updatedAt\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PlaidAccounts($connectionId: ID!) {\n    plaidAccounts(connectionId: $connectionId) {\n      id\n      plaidConnectionId\n      externalId\n      name\n      officialName\n      type\n      subtype\n      currentBalance\n      isoCurrencyCode\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query PlaidAccounts($connectionId: ID!) {\n    plaidAccounts(connectionId: $connectionId) {\n      id\n      plaidConnectionId\n      externalId\n      name\n      officialName\n      type\n      subtype\n      currentBalance\n      isoCurrencyCode\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CreatePlaidLinkToken {\n    createPlaidLinkToken\n  }\n"): (typeof documents)["\n  query CreatePlaidLinkToken {\n    createPlaidLinkToken\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ExpenseFields on Expense {\n    id\n    userId\n    budgetId\n    amount\n    date\n    description\n    splits {\n      id\n      categoryId\n      amount\n      description\n    }\n    sourceType\n    sourceTemplateId\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment ExpenseFields on Expense {\n    id\n    userId\n    budgetId\n    amount\n    date\n    description\n    splits {\n      id\n      categoryId\n      amount\n      description\n    }\n    sourceType\n    sourceTemplateId\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateExpense($input: CreateExpenseInput!) {\n    createExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateExpense($input: CreateExpenseInput!) {\n    createExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateExpense($input: UpdateExpenseInput!) {\n    updateExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateExpense($input: UpdateExpenseInput!) {\n    updateExpense(input: $input) {\n      ...ExpenseFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteExpense($id: ID!) {\n    deleteExpense(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteExpense($id: ID!) {\n    deleteExpense(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetExpensesByBudget($budgetId: ID!) {\n    expenses(budgetId: $budgetId) {\n      ...ExpenseFields\n    }\n  }\n"): (typeof documents)["\n  query GetExpensesByBudget($budgetId: ID!) {\n    expenses(budgetId: $budgetId) {\n      ...ExpenseFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetGoals {\n    goals {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetGoals {\n    goals {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateGoal($input: CreateGoalInput!) {\n    createGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateGoal($input: CreateGoalInput!) {\n    createGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteGoal($id: ID!) {\n    deleteGoal(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteGoal($id: ID!) {\n    deleteGoal(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateFinancialOrderSteps {\n    createFinancialOrderSteps {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateFinancialOrderSteps {\n    createFinancialOrderSteps {\n      id\n      userId\n      description\n      isCompleted\n      targetAmount\n      targetDate\n      category\n      customCategory\n      priority\n      notes\n      connectedAccountIds\n      isFinancialOrderStep\n      financialOrderStep\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment IncomeFields on Income {\n    id\n    userId\n    budgetId\n    name\n    amount\n    date\n    sourceType\n    sourceTemplateId\n    sourceOccurrenceDate\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment IncomeFields on Income {\n    id\n    userId\n    budgetId\n    name\n    amount\n    date\n    sourceType\n    sourceTemplateId\n    sourceOccurrenceDate\n    generationMonth\n    personId\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateIncome($input: CreateIncomeInput!) {\n    createIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateIncome($input: CreateIncomeInput!) {\n    createIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateIncome($input: UpdateIncomeInput!) {\n    updateIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateIncome($input: UpdateIncomeInput!) {\n    updateIncome(input: $input) {\n      ...IncomeFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteIncome($id: ID!) {\n    deleteIncome(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteIncome($id: ID!) {\n    deleteIncome(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetIncomesByBudget($budgetId: ID!) {\n    incomes(budgetId: $budgetId) {\n      ...IncomeFields\n    }\n  }\n"): (typeof documents)["\n  query GetIncomesByBudget($budgetId: ID!) {\n    incomes(budgetId: $budgetId) {\n      ...IncomeFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PaycheckDeductions($personId: ID!) {\n    paycheckDeductions(personId: $personId) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query PaycheckDeductions($personId: ID!) {\n    paycheckDeductions(personId: $personId) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertPaycheckDeduction($input: UpsertPaycheckDeductionInput!) {\n    upsertPaycheckDeduction(input: $input) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertPaycheckDeduction($input: UpsertPaycheckDeductionInput!) {\n    upsertPaycheckDeduction(input: $input) {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PaycheckDeductionsByUser {\n    paycheckDeductionsByUser {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query PaycheckDeductionsByUser {\n    paycheckDeductionsByUser {\n      id\n      userId\n      personId\n      name\n      amount\n      pretax\n      kind\n      linkedAccountId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePaycheckDeduction($id: ID!) {\n    deletePaycheckDeduction(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePaycheckDeduction($id: ID!) {\n    deletePaycheckDeduction(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertPlannerPerson($input: UpsertPlannerPersonInput!) {\n    upsertPlannerPerson(input: $input) {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertPlannerPerson($input: UpsertPlannerPersonInput!) {\n    upsertPlannerPerson(input: $input) {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePlannerPerson($id: ID!) {\n    deletePlannerPerson(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePlannerPerson($id: ID!) {\n    deletePlannerPerson(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PlannerPeople {\n    plannerPeople {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query PlannerPeople {\n    plannerPeople {\n      id\n      userId\n      name\n      birthday\n      retirementAge\n      annualSalary\n      bonusMode\n      bonusFrequency\n      annualBonus\n      incomeGrowthRate\n      payType\n      payDay\n      payCadence\n      hourlyRate\n      expectedHoursPerWeek\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ContributionLimits($taxYear: Int!) {\n    contributionLimits(taxYear: $taxYear) {\n      id\n      accountType\n      taxYear\n      annualLimit\n      catchUpAge\n      catchUpAmount\n      familyAnnualLimit\n    }\n  }\n"): (typeof documents)["\n  query ContributionLimits($taxYear: Int!) {\n    contributionLimits(taxYear: $taxYear) {\n      id\n      accountType\n      taxYear\n      annualLimit\n      catchUpAge\n      catchUpAmount\n      familyAnnualLimit\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NetWorthSnapshots {\n    netWorthSnapshots {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query NetWorthSnapshots {\n    netWorthSnapshots {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateNetWorthSnapshot($input: CreateNetWorthSnapshotInput!) {\n    createNetWorthSnapshot(input: $input) {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateNetWorthSnapshot($input: CreateNetWorthSnapshotInput!) {\n    createNetWorthSnapshot(input: $input) {\n      id\n      userId\n      snapshotDate\n      totalAssets\n      totalLiabilities\n      netWorth\n      items {\n        id\n        snapshotId\n        accountId\n        label\n        amount\n        kind\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNetWorthSnapshot($id: ID!) {\n    deleteNetWorthSnapshot(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteNetWorthSnapshot($id: ID!) {\n    deleteNetWorthSnapshot(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Transactions($fromDate: String, $toDate: String) {\n    transactions(fromDate: $fromDate, toDate: $toDate) {\n      id\n      userId\n      plaidAccountId\n      plaidTransactionId\n      date\n      amount\n      name\n      expenseCategoryId\n      pending\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Transactions($fromDate: String, $toDate: String) {\n    transactions(fromDate: $fromDate, toDate: $toDate) {\n      id\n      userId\n      plaidAccountId\n      plaidTransactionId\n      date\n      amount\n      name\n      expenseCategoryId\n      pending\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AssignTransactionCategory($id: ID!, $expenseCategoryId: ID) {\n    assignTransactionCategory(id: $id, expenseCategoryId: $expenseCategoryId) {\n      id\n      expenseCategoryId\n    }\n  }\n"): (typeof documents)["\n  mutation AssignTransactionCategory($id: ID!, $expenseCategoryId: ID) {\n    assignTransactionCategory(id: $id, expenseCategoryId: $expenseCategoryId) {\n      id\n      expenseCategoryId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTransaction($id: ID!) {\n    deleteTransaction(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTransaction($id: ID!) {\n    deleteTransaction(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      email\n      identityProviderId\n      inflationRate\n      safeWithdrawalRate\n      filingStatus\n      returnType\n      currencyType\n      deductionType\n      deductionAmount\n      payoffStrategy\n      maxTaxBracketId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      email\n      identityProviderId\n      inflationRate\n      safeWithdrawalRate\n      filingStatus\n      returnType\n      currencyType\n      deductionType\n      deductionAmount\n      payoffStrategy\n      maxTaxBracketId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRecurringExpenses {\n    recurringExpenses {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetRecurringExpenses {\n    recurringExpenses {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRecurringIncomes {\n    recurringIncomes {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetRecurringIncomes {\n    recurringIncomes {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateRecurringIncome($input: CreateRecurringIncomeInput!) {\n    createRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateRecurringIncome($input: CreateRecurringIncomeInput!) {\n    createRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateRecurringIncome($input: UpdateRecurringIncomeInput!) {\n    updateRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateRecurringIncome($input: UpdateRecurringIncomeInput!) {\n    updateRecurringIncome(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteRecurringIncome($id: ID!) {\n    deleteRecurringIncome(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteRecurringIncome($id: ID!) {\n    deleteRecurringIncome(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateRecurringExpense($input: CreateRecurringExpenseInput!) {\n    createRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateRecurringExpense($input: CreateRecurringExpenseInput!) {\n    createRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateRecurringExpense($input: UpdateRecurringExpenseInput!) {\n    updateRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateRecurringExpense($input: UpdateRecurringExpenseInput!) {\n    updateRecurringExpense(input: $input) {\n      id\n      userId\n      name\n      amount\n      recurrenceInterval\n      paydayDayOfMonth\n      startDate\n      endDate\n      personId\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteRecurringExpense($id: ID!) {\n    deleteRecurringExpense(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteRecurringExpense($id: ID!) {\n    deleteRecurringExpense(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RetirementAccess {\n    retirementAccess {\n      hsaReceipts {\n        id\n        userId\n        incurredOn\n        description\n        amount\n        createdAt\n        updatedAt\n      }\n      hsaReimbursements {\n        id\n        userId\n        reimbursedOn\n        amount\n        note\n        createdAt\n        updatedAt\n      }\n      hsaSummary {\n        totalReceipts\n        totalReimbursed\n        availableToReimburse\n      }\n      rothConversions {\n        id\n        userId\n        convertedOn\n        amount\n        fromAssetId\n        toAssetId\n        note\n        createdAt\n        updatedAt\n      }\n      rothBuckets {\n        year\n        amount\n        availableOn\n        accessible\n      }\n    }\n  }\n"): (typeof documents)["\n  query RetirementAccess {\n    retirementAccess {\n      hsaReceipts {\n        id\n        userId\n        incurredOn\n        description\n        amount\n        createdAt\n        updatedAt\n      }\n      hsaReimbursements {\n        id\n        userId\n        reimbursedOn\n        amount\n        note\n        createdAt\n        updatedAt\n      }\n      hsaSummary {\n        totalReceipts\n        totalReimbursed\n        availableToReimburse\n      }\n      rothConversions {\n        id\n        userId\n        convertedOn\n        amount\n        fromAssetId\n        toAssetId\n        note\n        createdAt\n        updatedAt\n      }\n      rothBuckets {\n        year\n        amount\n        availableOn\n        accessible\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateHsaReceipt($input: CreateHsaReceiptInput!) {\n    createHsaReceipt(input: $input) {\n      id\n      userId\n      incurredOn\n      description\n      amount\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateHsaReceipt($input: CreateHsaReceiptInput!) {\n    createHsaReceipt(input: $input) {\n      id\n      userId\n      incurredOn\n      description\n      amount\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteHsaReceipt($id: ID!) {\n    deleteHsaReceipt(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteHsaReceipt($id: ID!) {\n    deleteHsaReceipt(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateHsaReimbursement($input: CreateHsaReimbursementInput!) {\n    createHsaReimbursement(input: $input) {\n      id\n      userId\n      reimbursedOn\n      amount\n      note\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateHsaReimbursement($input: CreateHsaReimbursementInput!) {\n    createHsaReimbursement(input: $input) {\n      id\n      userId\n      reimbursedOn\n      amount\n      note\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteHsaReimbursement($id: ID!) {\n    deleteHsaReimbursement(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteHsaReimbursement($id: ID!) {\n    deleteHsaReimbursement(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateRothConversion($input: CreateRothConversionInput!) {\n    createRothConversion(input: $input) {\n      id\n      userId\n      convertedOn\n      amount\n      fromAssetId\n      toAssetId\n      note\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateRothConversion($input: CreateRothConversionInput!) {\n    createRothConversion(input: $input) {\n      id\n      userId\n      convertedOn\n      amount\n      fromAssetId\n      toAssetId\n      note\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteRothConversion($id: ID!) {\n    deleteRothConversion(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteRothConversion($id: ID!) {\n    deleteRothConversion(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CalculateRetirementLadder(\n    $initialBalance: String!\n    $annualExpenses: String!\n    $currentAge: Int!\n    $firstWithdrawalAge: Int!\n    $isRoth: Boolean!\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $yearsToProject: Int\n  ) {\n    calculateRetirementLadder(\n      initialBalance: $initialBalance\n      annualExpenses: $annualExpenses\n      currentAge: $currentAge\n      firstWithdrawalAge: $firstWithdrawalAge\n      isRoth: $isRoth\n      year: $year\n      filingStatus: $filingStatus\n      yearsToProject: $yearsToProject\n    ) {\n      initialBalance\n      annualExpenses\n      currentAge\n      firstWithdrawalAge\n      isRoth\n      projectedSteps {\n        year\n        age\n        withdrawalAmount\n        taxableWithdrawal\n        estimatedIncomeTax\n        earlyWithdrawalPenalty\n        netWithdrawal\n        remainingBalance\n        isAccessible\n      }\n      isSustainable\n      projectedDepletionAge\n    }\n  }\n"): (typeof documents)["\n  query CalculateRetirementLadder(\n    $initialBalance: String!\n    $annualExpenses: String!\n    $currentAge: Int!\n    $firstWithdrawalAge: Int!\n    $isRoth: Boolean!\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $yearsToProject: Int\n  ) {\n    calculateRetirementLadder(\n      initialBalance: $initialBalance\n      annualExpenses: $annualExpenses\n      currentAge: $currentAge\n      firstWithdrawalAge: $firstWithdrawalAge\n      isRoth: $isRoth\n      year: $year\n      filingStatus: $filingStatus\n      yearsToProject: $yearsToProject\n    ) {\n      initialBalance\n      annualExpenses\n      currentAge\n      firstWithdrawalAge\n      isRoth\n      projectedSteps {\n        year\n        age\n        withdrawalAmount\n        taxableWithdrawal\n        estimatedIncomeTax\n        earlyWithdrawalPenalty\n        netWithdrawal\n        remainingBalance\n        isAccessible\n      }\n      isSustainable\n      projectedDepletionAge\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTaxYearData($filingStatus: FilingStatus!) {\n    taxYearData(filingStatus: $filingStatus) {\n      year\n      brackets {\n        minimumAmount\n        maximumAmount\n        rate\n      }\n      standardDeduction\n      ssWageBase\n    }\n  }\n"): (typeof documents)["\n  query GetTaxYearData($filingStatus: FilingStatus!) {\n    taxYearData(filingStatus: $filingStatus) {\n      year\n      brackets {\n        minimumAmount\n        maximumAmount\n        rate\n      }\n      standardDeduction\n      ssWageBase\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EstimateTaxesForYear(\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $income: String!\n    $deduction: String\n  ) {\n    estimateTaxesForYear(\n      year: $year\n      filingStatus: $filingStatus\n      income: $income\n      deduction: $deduction\n    ) {\n      taxOwed\n      taxableIncome\n      effectiveRate\n      marginalRate\n    }\n  }\n"): (typeof documents)["\n  query EstimateTaxesForYear(\n    $year: Int!\n    $filingStatus: FilingStatus!\n    $income: String!\n    $deduction: String\n  ) {\n    estimateTaxesForYear(\n      year: $year\n      filingStatus: $filingStatus\n      income: $income\n      deduction: $deduction\n    ) {\n      taxOwed\n      taxableIncome\n      effectiveRate\n      marginalRate\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentUserPreferences {\n    me {\n      id\n      identityProviderId\n      email\n      returnType\n      safeWithdrawalRate\n      currencyType\n      inflationRate\n      deductionType\n      deductionAmount\n      maxTaxBracketId\n      filingStatus\n      payoffStrategy\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n"): (typeof documents)["\n  query CurrentUserPreferences {\n    me {\n      id\n      identityProviderId\n      email\n      returnType\n      safeWithdrawalRate\n      currencyType\n      inflationRate\n      deductionType\n      deductionAmount\n      maxTaxBracketId\n      filingStatus\n      payoffStrategy\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserSetup($input: UpdateUserSetupInput!) {\n    updateUserSetup(input: $input) {\n      id\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserSetup($input: UpdateUserSetupInput!) {\n    updateUserSetup(input: $input) {\n      id\n      budgetEnabled\n      monthlyExpenses\n      setupCompleted\n      disclaimerAccepted\n      disclaimerAcceptedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserPreferences($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserPreferences($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUserPreferences($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUserPreferences($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;