import type { PlannerAccount } from '../../future/types/account';
import type { PlannerSummary } from '../../future/types/planner';

/**
 * Compute which FOO steps are completed based on the user's financial data.
 * Only auto-checks — never unchecks steps the user has manually completed.
 */
export function computeFooStepCompletion(
  accounts: PlannerAccount[],
  summary: PlannerSummary | null,
): Map<number, boolean> {
  const results = new Map<number, boolean>();

  if (!summary) return results;

  const hasAnyHighInterestDebt = accounts.some(
    (a) =>
      (a.accountType === 'credit-card' || a.accountType === 'personal-loan') &&
      a.startingBalance > 0,
  );

  const hasLowInterestDebt = accounts.some(
    (a) =>
      (a.accountType === 'mortgage' || a.accountType === 'student-loan') &&
      a.startingBalance > 0,
  );

  const hasEmployerMatch = accounts.some(
    (a) =>
      (a.accountType === '401k' || a.accountType === '403b' || a.accountType === '457') &&
      a.employerMatchRate > 0,
  );

  const hasEmergencyFund = accounts.some(
    (a) => a.accountType === 'emergency-fund' && a.startingBalance > 0,
  );

  const hasRothIra = accounts.some(
    (a) => a.accountType === 'roth-ira' && a.startingBalance > 0,
  );

  const hasHsa = accounts.some((a) => a.accountType === 'hsa' && a.startingBalance > 0);

  const hasEmployerPlan = accounts.some(
    (a) =>
      (a.accountType === '401k' || a.accountType === '403b' || a.accountType === '457') &&
      a.startingBalance > 0,
  );

  const savingsRate = summary.currentSavingsRateTotalPercent;

  // Step 1: Cover deductibles — can't auto-detect (no insurance data)
  results.set(1, false);

  // Step 2: Get employer match — has a retirement account with employer match configured
  results.set(2, hasEmployerMatch);

  // Step 3: Pay off high-interest debt — no credit cards or personal loans with balance
  results.set(3, !hasAnyHighInterestDebt);

  // Step 4: Emergency fund — has an emergency fund with positive balance
  results.set(4, hasEmergencyFund);

  // Step 5: Max out Roth IRA and HSA — has both (or Roth IRA if no HSA-eligible plan)
  results.set(5, hasRothIra && (hasHsa || !accounts.some((a) => a.accountType === 'hsa')));

  // Step 6: Max out employer plans — has a 401k/403b/457 with positive balance
  results.set(6, hasEmployerPlan);

  // Step 7: Hyperaccumulation — saving 25%+ of income
  results.set(7, savingsRate >= 25);

  // Step 8: Prepay future expenses — can't auto-detect (subjective goals)
  results.set(8, false);

  // Step 9: Pay off low-interest debt — no mortgage or student loans
  results.set(9, !hasLowInterestDebt);

  return results;
}
