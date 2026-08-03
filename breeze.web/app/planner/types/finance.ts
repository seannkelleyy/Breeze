export type VehicleDepreciationProfile = 'low' | 'medium' | 'high' | 'custom';
export type HomeGrowthProfile = 'none' | 'low' | 'medium' | 'high' | 'custom';

export type AssetFinanceDetails = {
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  annualChangeRate: number;
  homeGrowthProfile: HomeGrowthProfile;
  vehicleDepreciationProfile: VehicleDepreciationProfile;
  hasLoan: boolean;
  loanInterestRate: number;
  originalLoanAmount: number;
  loanMonthlyPayment: number;
  loanTermYears: number;
  loanStartDate: string;
  currentLoanBalance: number;
};

export type AssetFinanceSnapshot = {
  assetValue: number;
  loanBalance: number;
  equity: number;
  monthsSincePurchase: number;
  remainingLoanMonths: number;
};

export type FinancialMathScenario = {
  label: string;
  spendMultiplier: number;
  yearlySpend: number;
  targetAmount: number;
  percentToGoal: number;
  yearsUntilGoal: number | null;
};

export type FinancialMathSnapshot = {
  monthlyExpenses: number;
  annualSpend: number;
  emergencyFundBalance: number;
  emergencyFund3Months: number;
  emergencyFund6Months: number;
  emergencyFund12Months: number;
  selfSalary: number;
  spouseSalary: number;
  grossIncome: number;
  netIncomeFactor: number;
  netIncome: number;
  annualExtraExpenseBuffer: number;
  yearlySavings: number;
  safeWithdrawalRatePercent: number;
  withdrawalMultiplier: number;
  currentPortfolio: number;
  yearlyPortfolioIncome: number;
  yearsToGoalRatePercent: number;
  scenarios: FinancialMathScenario[];
};
