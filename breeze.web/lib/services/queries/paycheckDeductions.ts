export const GET_PAYCHECK_DEDUCTIONS = `query PaycheckDeductions($personId: ID!) {
  paycheckDeductions(personId: $personId) { id userId personId name amount pretax kind linkedAccountId createdAt updatedAt }
}`;
export const UPSERT_PAYCHECK_DEDUCTION = `mutation UpsertPaycheckDeduction($input: UpsertPaycheckDeductionInput!) {
  upsertPaycheckDeduction(input: $input) { id userId personId name amount pretax kind linkedAccountId createdAt updatedAt }
}`;
export const GET_PAYCHECK_DEDUCTIONS_BY_USER = `query PaycheckDeductionsByUser($userId: ID!) { paycheckDeductionsByUser(userId: $userId) { id userId personId name amount pretax kind linkedAccountId createdAt updatedAt } }`;
export const DELETE_PAYCHECK_DEDUCTION = `mutation DeletePaycheckDeduction($id: ID!) {
  deletePaycheckDeduction(id: $id)
}`;
