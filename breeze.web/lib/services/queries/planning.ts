// GraphQL operations for contribution limits, net worth snapshots, and
// bank transactions.

export const GET_CONTRIBUTION_LIMITS = `query ContributionLimits($taxYear: Int!) {
  contributionLimits(taxYear: $taxYear) { id accountType taxYear annualLimit catchUpAge catchUpAmount familyAnnualLimit }
}`;

export const GET_NET_WORTH_SNAPSHOTS = `query NetWorthSnapshots($userId: ID!) {
  netWorthSnapshots(userId: $userId) {
    id userId snapshotDate totalAssets totalLiabilities netWorth
    items { id snapshotId accountId label amount kind }
    createdAt updatedAt
  }
}`;

export const CREATE_NET_WORTH_SNAPSHOT = `mutation CreateNetWorthSnapshot($input: CreateNetWorthSnapshotInput!) {
  createNetWorthSnapshot(input: $input) {
    id userId snapshotDate totalAssets totalLiabilities netWorth
    items { id snapshotId accountId label amount kind }
    createdAt updatedAt
  }
}`;

export const DELETE_NET_WORTH_SNAPSHOT = `mutation DeleteNetWorthSnapshot($id: ID!) {
  deleteNetWorthSnapshot(id: $id)
}`;

export const GET_TRANSACTIONS = `query Transactions($userId: ID!, $fromDate: String, $toDate: String) {
  transactions(userId: $userId, fromDate: $fromDate, toDate: $toDate) {
    id userId plaidAccountId plaidTransactionId date amount name expenseCategoryId pending createdAt updatedAt
  }
}`;

export const ASSIGN_TRANSACTION_CATEGORY = `mutation AssignTransactionCategory($id: ID!, $expenseCategoryId: ID) {
  assignTransactionCategory(id: $id, expenseCategoryId: $expenseCategoryId) { id expenseCategoryId }
}`;

export const DELETE_TRANSACTION = `mutation DeleteTransaction($id: ID!) {
  deleteTransaction(id: $id)
}`;
