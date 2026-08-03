export type SectionKey =
  | 'people'
  | 'retirementInputs'
  | 'plannerTools'
  | 'accounts'
  | 'requiredMonthly'
  | 'plannedMonthly'
  | 'retirementEstimateCard'
  | 'projectionChart'
  | 'yearlyProjection'
  | 'accountBreakdown';

export type PlannerSummary = {
  monthlyNeededForDesiredTarget: number;
  requiredMonthlyTargetLabel: string;
  annualHouseholdIncome: number;
  currentSavingsRateEmployeePercent: number;
  currentSavingsRateTotalPercent: number;
  requiredSavingsRatePercent: number;
  savingsRateGapPercent: number;
  weightedAnnualRate: number;
  yearsToGoal: number;
  monthlyGapToGoal: number;
  isMonthlyGapPositive: boolean;
  totalStartingBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  targetAge: number;
  projectedNetWorthAtTargetAge: number;
  totalPlannedMonthlyInvestment: number;
  annualNeedAtRetirement: number;
  financialFreedomTarget: number;
  monthlyNeededForFreedomTarget: number;
};

export interface PlannerUpsertRequest {
  desiredInvestmentAmount: number;
  monthlyExpenses: number;
  inflationRate: number;
  safeWithdrawalRate: number;
  people: import('./person').PlannerPersonDto[];
  accounts: import('./account').PlannerAccountDto[];
}

export interface PlannerResponse extends PlannerUpsertRequest {
  id: number;
  userId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}
