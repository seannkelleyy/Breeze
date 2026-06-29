import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { useQuery } from '@tanstack/react-query';
import { PlannerResponse } from '../../types/planner';

const useFetchPlanner = () => {
  const {
    plannerDesiredInvestmentAmount,
    plannerMonthlyExpenses,
    inflationRate,
    safeWithdrawalRate,
    plannerPeople,
    plannerAccounts,
  } = useCurrentUser();

  const fetchPlanner = () => {
    const now = new Date().toISOString();
    return Promise.resolve({
      id: 0,
      userId: 'current-user',
      desiredInvestmentAmount: plannerDesiredInvestmentAmount,
      monthlyExpenses: plannerMonthlyExpenses,
      inflationRate,
      safeWithdrawalRate,
      people: (plannerPeople || []).map((person: Record<string, unknown>) => ({
        personType: person.type as string,
        name: person.name as string,
        birthday: person.birthday as string,
        retirementAge: person.retirementAge as number,
        annualSalary: person.annualSalary as number,
        bonusMode: person.bonusMode as string,
        annualBonus: person.annualBonus as number,
        incomeGrowthRate: person.incomeGrowthRate as number,
      })),
      accounts: (plannerAccounts || []).map((account: Record<string, unknown>) => ({
        name: account.name,
        owner: account.owner,
        accountType: account.accountType,
        contributionMode: account.contributionMode,
        contributionValue: account.contributionValue,
        employerMatchRate: account.employerMatchRate,
        employerMatchMaxPercentOfSalary: account.employerMatchMaxPercentOfSalary,
        startingBalance: account.startingBalance,
        annualRate: account.annualRate,
        purchaseDate: account.purchaseDate ?? null,
        purchasePrice: account.purchasePrice ?? null,
        currentValue: account.currentValue ?? null,
        annualChangeRate: account.annualChangeRate ?? null,
        homeGrowthProfile: account.homeGrowthProfile ?? null,
        vehicleDepreciationProfile: account.vehicleDepreciationProfile ?? null,
        hasLoan: account.hasLoan ?? false,
        loanInterestRate: account.loanInterestRate ?? null,
        originalLoanAmount: account.originalLoanAmount ?? null,
        loanMonthlyPayment: account.loanMonthlyPayment ?? null,
        loanTermYears: account.loanTermYears ?? null,
        loanStartDate: account.loanStartDate ?? null,
        currentLoanBalance: account.currentLoanBalance ?? null,
      })),
      createdAtUtc: now,
      updatedAtUtc: now,
    });
  };

  return useQuery({
    queryKey: ['planner'],
    queryFn: fetchPlanner,
    refetchInterval: false,
    retryDelay: 1 * 1000,
    retry: 0,
    enabled: true,
  });
};

export default useFetchPlanner;
