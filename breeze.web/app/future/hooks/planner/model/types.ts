import type { PlannerPerson } from '../../../types/person';

export interface Household {
  people: PlannerPerson[];
  currentAge: number;
  targetAge: number;
  yearsToGoal: number;
  annualHouseholdIncome: number;
}

export interface Portfolio {
  totalStartingBalance: number;
  investmentStartingBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  totalPlannedMonthlyEmployee: number;
  totalPlannedMonthlyInvestment: number;
  weightedAnnualRate: number;
  effectiveWeightedAnnualRate: number;
  realWeightedAnnualRate: number;
  currentSavingsRateEmployee: number;
  currentSavingsRateTotal: number;
  emergencyFundBalance: number;
}
