import { ChartConfig } from '@/components/ui/chart'
import { AccountRateProfile, AccountType, PlannerAccount } from '../types/account'
import { AssetFinanceDetails, AssetFinanceSnapshot, FinancialMathSnapshot, HomeGrowthProfile, VehicleDepreciationProfile } from '../types/finance'
import { IrsLimitConfig, IrsLimitKey } from '../types/irs'
import { BonusMode, PlannerPerson } from '../types/person'
import { ProjectionRow } from '../types/projection'
import * as plannerConfig from './config'
import * as plannerConstants from './constants'

const { accountTypesWithoutIrsLimits, isCombinedAssetType, isDepreciatingAssetType, isLiabilityAccountType, isNonContributingAccountType } = plannerConfig

export const plannerChartConfig = {
	totalBalance: {
		label: 'Total Portfolio',
		color: 'hsl(var(--chart-1))',
	},
} satisfies ChartConfig

export const accountLineColors = ['hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-1))']

export const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min)

export const normalizeBonusMode = (value: string | undefined): BonusMode => {
	if (value === 'salary-percent' || value === 'percent') {
		return 'salary-percent'
	}

	return 'dollars'
}

export const toIsoDate = (date: Date) => {
	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')
	return `${year}-${month}-${day}`
}

const getMonthsBetween = (from: Date, to: Date) => {
	const monthDelta = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
	if (monthDelta <= 0) {
		return 0
	}

	return to.getDate() >= from.getDate() ? monthDelta : monthDelta - 1
}

export const getHomeAnnualGrowthRate = (profile: HomeGrowthProfile | string | undefined, customAnnualRate: number) => {
	if (profile === 'custom') {
		return customAnnualRate
	}

	if (profile === 'none' || profile === 'low' || profile === 'medium' || profile === 'high') {
		return plannerConstants.PLANNER_HOME_GROWTH_PROFILE_RATES[profile]
	}

	return plannerConstants.PLANNER_DEFAULT_HOME_APPRECIATION_RATE
}

export const getVehicleAnnualDepreciationRate = (profile: VehicleDepreciationProfile, yearsSincePurchase: number, customAnnualRate: number) => {
	if (profile === 'custom') {
		return clamp(Math.abs(customAnnualRate), 0)
	}

	const age = clamp(yearsSincePurchase, 0)
	const firstYearRate = plannerConstants.PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES[profile]
	const matureRateFloor = plannerConstants.PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS[profile]
	const taperStrength = plannerConstants.PLANNER_VEHICLE_DEPRECIATION_TAPER_STRENGTH

	return matureRateFloor + (firstYearRate - matureRateFloor) * Math.exp(-taperStrength * age)
}

export const getAssetFinanceSnapshot = (details: AssetFinanceDetails, asOf: Date): AssetFinanceSnapshot => {
	const parsedPurchaseDate = new Date(details.purchaseDate)
	const safePurchaseDate = Number.isNaN(parsedPurchaseDate.getTime()) ? new Date() : parsedPurchaseDate
	const monthsSincePurchase = getMonthsBetween(safePurchaseDate, asOf)
	const assetValue = clamp(details.currentValue)

	if (!details.hasLoan) {
		return {
			assetValue,
			loanBalance: 0,
			equity: assetValue,
			monthsSincePurchase,
			remainingLoanMonths: 0,
		}
	}

	const parsedLoanStartDate = new Date(details.loanStartDate)
	const safeLoanStartDate = Number.isNaN(parsedLoanStartDate.getTime()) ? new Date() : parsedLoanStartDate
	const termMonths = Math.max(1, Math.round(clamp(details.loanTermYears) * 12))
	const elapsedLoanMonths = getMonthsBetween(safeLoanStartDate, asOf)
	const remainingLoanMonths = Math.max(0, termMonths - elapsedLoanMonths)
	const loanBalance = clamp(details.currentLoanBalance)

	return {
		assetValue,
		loanBalance,
		equity: assetValue - loanBalance,
		monthsSincePurchase,
		remainingLoanMonths,
	}
}

export const getMonthlyContribution = (targetAmount: number, startingBalance: number, annualRatePercent: number, years: number) => {
	const months = Math.max(0, Math.round(years * 12))
	if (months === 0) {
		return 0
	}

	const monthlyRate = annualRatePercent / 100 / 12
	if (monthlyRate === 0) {
		return clamp((targetAmount - startingBalance) / months)
	}

	const growthFactor = (1 + monthlyRate) ** months
	const futureValueOfPrincipal = startingBalance * growthFactor
	const annuityFactor = (growthFactor - 1) / monthlyRate

	if (annuityFactor === 0) {
		return 0
	}

	return clamp((targetAmount - futureValueOfPrincipal) / annuityFactor)
}

export const getYearsUntilGoalEstimate = (targetAmount: number, currentAmount: number, yearlySavings: number, annualRatePercent: number) => {
	const rate = annualRatePercent / 100
	if (targetAmount <= 0 || yearlySavings <= 0 || rate <= 0) {
		return null
	}

	const numerator = targetAmount * rate
	const denominator = yearlySavings
	const currentTerm = currentAmount * rate
	const growthBase = 1 + rate
	const inner = numerator / denominator + 1 + currentTerm / denominator

	if (inner <= 0 || growthBase <= 1) {
		return null
	}

	const years = Math.log(inner) / Math.log(growthBase)
	return Number.isFinite(years) && years >= 0 ? years : null
}

export const getFinancialMathSnapshot = ({
	monthlyExpenses,
	selfSalary,
	spouseSalary,
	safeWithdrawalRate,
	currentPortfolio,
}: {
	monthlyExpenses: number
	selfSalary: number
	spouseSalary: number
	safeWithdrawalRate: number
	currentPortfolio: number
}): FinancialMathSnapshot => {
	const normalizedMonthlyExpenses = clamp(monthlyExpenses)
	const annualSpend = normalizedMonthlyExpenses * 12
	const grossIncome = clamp(selfSalary) + clamp(spouseSalary)
	const netIncomeFactor = plannerConstants.PLANNER_DEFAULT_NET_INCOME_FACTOR
	const annualExtraExpenseBuffer = plannerConstants.PLANNER_DEFAULT_ANNUAL_EXTRA_EXPENSE_BUFFER
	const netIncome = grossIncome * netIncomeFactor
	const yearlySavings = clamp(netIncome - annualSpend - annualExtraExpenseBuffer)
	const safeWithdrawalRatePercent = Math.max(plannerConstants.PLANNER_SAFE_WITHDRAWAL_RATE_MIN, safeWithdrawalRate)
	const safeWithdrawalRateDecimal = safeWithdrawalRatePercent / 100
	const yearsToGoalRatePercent = plannerConstants.PLANNER_DEFAULT_FIRE_PROJECTION_RATE

	const scenarios = plannerConstants.PLANNER_FINANCIAL_MATH_SCENARIOS.map((scenario) => {
		const yearlySpend = annualSpend * scenario.spendMultiplier
		const targetAmount = safeWithdrawalRateDecimal > 0 ? yearlySpend / safeWithdrawalRateDecimal : 0
		const percentToGoal = targetAmount > 0 ? (clamp(currentPortfolio) / targetAmount) * 100 : 0
		const yearsUntilGoal = getYearsUntilGoalEstimate(targetAmount, clamp(currentPortfolio), yearlySavings, yearsToGoalRatePercent)

		return {
			label: scenario.label,
			spendMultiplier: scenario.spendMultiplier,
			yearlySpend,
			targetAmount,
			percentToGoal,
			yearsUntilGoal,
		}
	})

	return {
		monthlyExpenses: normalizedMonthlyExpenses,
		annualSpend,
		emergencyFund3Months: normalizedMonthlyExpenses * 3,
		emergencyFund6Months: normalizedMonthlyExpenses * 6,
		emergencyFund12Months: normalizedMonthlyExpenses * 12,
		selfSalary: clamp(selfSalary),
		spouseSalary: clamp(spouseSalary),
		grossIncome,
		netIncomeFactor,
		netIncome,
		annualExtraExpenseBuffer,
		yearlySavings,
		safeWithdrawalRatePercent,
		withdrawalMultiplier: safeWithdrawalRateDecimal > 0 ? 1 / safeWithdrawalRateDecimal : 0,
		currentPortfolio: clamp(currentPortfolio),
		yearlyPortfolioIncome: clamp(currentPortfolio) * safeWithdrawalRateDecimal,
		yearsToGoalRatePercent,
		scenarios,
	}
}

export const getRealAnnualRatePercent = (nominalAnnualRatePercent: number, inflationRatePercent: number) => {
	const nominal = nominalAnnualRatePercent / 100
	const inflation = inflationRatePercent / 100

	if (inflation <= -1) {
		return nominalAnnualRatePercent
	}

	return ((1 + nominal) / (1 + inflation) - 1) * 100
}

export const getEffectiveAnnualRatePercent = (annualRatePercent: number, inflationRatePercent: number, useInflationAdjustedValues: boolean) => {
	return useInflationAdjustedValues ? getRealAnnualRatePercent(annualRatePercent, inflationRatePercent) : annualRatePercent
}

export const getSuggestedSafeWithdrawalRate = (retirementHorizonYears: number) => {
	const normalizedRetirementHorizonYears = clamp(retirementHorizonYears)
	const suggestion = plannerConstants.PLANNER_SAFE_WITHDRAWAL_RATE_SUGGESTIONS.find((rule) => normalizedRetirementHorizonYears >= rule.minimumRetirementYears)
	return suggestion?.rate ?? plannerConstants.PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE
}

export const getNominalAnnualRatePercentFromReal = (realAnnualRatePercent: number, inflationRatePercent: number) => {
	const realDecimal = realAnnualRatePercent / 100
	const inflationDecimal = inflationRatePercent / 100
	return ((1 + realDecimal) * (1 + inflationDecimal) - 1) * 100
}

export const formatCurrencyWithCode = (value: number, currencyCode: string) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currencyCode,
		maximumFractionDigits: 0,
	}).format(value)

const isIrsLimitAccountType = (accountType: AccountType): accountType is IrsLimitKey => {
	switch (accountType) {
		case '401k':
		case '403b':
		case '457':
		case 'roth-ira':
		case 'traditional-ira':
		case 'hsa':
			return true
		default:
			return false
	}
}

export const getDisplayedRatePercent = (account: PlannerAccount, inflationRatePercent: number, useInflationAdjustedValues: boolean) => {
	const effectiveAnnualRate = getEffectiveAnnualRatePercent(account.annualRate, inflationRatePercent, useInflationAdjustedValues)

	if (isDepreciatingAssetType(account.accountType)) {
		return Math.abs(Math.min(0, effectiveAnnualRate))
	}

	return effectiveAnnualRate
}

export const getAccountAnnualRateFromProfile = (profile: AccountRateProfile, currentAnnualRate: number, inflationRatePercent: number, useInflationAdjustedValues: boolean) => {
	if (profile === 'custom') {
		return currentAnnualRate
	}

	const nominalAnnualRate = plannerConstants.PLANNER_ACCOUNT_RATE_PROFILE_RATES[profile]
	return getEffectiveAnnualRatePercent(nominalAnnualRate, inflationRatePercent, useInflationAdjustedValues)
}

export const getAccountRateProfileFromAnnualRate = (annualRate: number, inflationRatePercent: number, useInflationAdjustedValues: boolean): AccountRateProfile => {
	const tolerance = 0.0001
	const rates = plannerConstants.PLANNER_ACCOUNT_RATE_PROFILE_RATES
	const profileOrder: Array<Exclude<AccountRateProfile, 'custom'>> = ['none', 'money-market', 'bonds', 'stock-bond-mix', 'stocks']

	for (const profile of profileOrder) {
		const effectiveProfileRate = getEffectiveAnnualRatePercent(rates[profile], inflationRatePercent, useInflationAdjustedValues)
		if (Math.abs(annualRate - effectiveProfileRate) <= tolerance) {
			return profile
		}
	}

	return 'custom'
}

export const getStoredAnnualRateFromInput = (account: PlannerAccount, value: number, inflationRatePercent: number, useInflationAdjustedValues: boolean) => {
	const normalizedInput = clamp(value)
	const normalizedNominalRate = useInflationAdjustedValues ? getNominalAnnualRatePercentFromReal(normalizedInput, inflationRatePercent) : normalizedInput

	if (isDepreciatingAssetType(account.accountType)) {
		return -normalizedNominalRate
	}

	return normalizedNominalRate
}

export const getNetWorthStartingBalance = (account: PlannerAccount) => {
	const normalizedBalance = clamp(account.startingBalance)
	return isLiabilityAccountType(account.accountType) ? -normalizedBalance : normalizedBalance
}

export const defaultIrsLimits: IrsLimitConfig = plannerConstants.PLANNER_DEFAULT_IRS_LIMITS

export const getAgeFromBirthday = (birthday: string) => {
	if (!birthday) {
		return 0
	}

	const date = new Date(birthday)
	if (Number.isNaN(date.getTime())) {
		return 0
	}

	const now = new Date()
	let age = now.getFullYear() - date.getFullYear()
	const monthDiff = now.getMonth() - date.getMonth()
	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
		age -= 1
	}

	return clamp(age)
}

export const getSuggestedAnnualLimit = (accountType: AccountType, age: number, limits: IrsLimitConfig, hasSpouse: boolean) => {
	const normalizedAge = clamp(age)

	if (accountTypesWithoutIrsLimits.has(accountType)) {
		return 0
	}

	if (!isIrsLimitAccountType(accountType)) {
		return 0
	}

	const limitRule = limits[accountType]
	if (!limitRule) {
		return 0
	}

	const annualLimit = hasSpouse && clamp(limitRule.familyAnnualLimit ?? 0) > 0 ? clamp(limitRule.familyAnnualLimit ?? 0) : clamp(limitRule.baseAnnualLimit)

	return annualLimit + (normalizedAge >= clamp(limitRule.catchUpAge) ? clamp(limitRule.catchUpAmount) : 0)
}

export const getIrsLimitKeyFromApiType = (type: string): IrsLimitKey | null => {
	const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '')

	switch (normalizedType) {
		case '401k':
			return '401k'
		case '403b':
			return '403b'
		case '457':
			return '457'
		case 'rothira':
			return 'roth-ira'
		case 'traditionalira':
			return 'traditional-ira'
		case 'hsa':
			return 'hsa'
		default:
			return null
	}
}

export const getOwnerAnnualIncome = (account: PlannerAccount, selfAnnualIncome: number, spouseAnnualIncome: number) =>
	account.owner === 'spouse' ? spouseAnnualIncome : selfAnnualIncome

const getBonusAmount = (person: PlannerPerson | undefined) => {
	if (!person) {
		return 0
	}

	const salary = clamp(person.annualSalary)
	if (person.bonusMode === 'salary-percent') {
		return (salary * clamp(person.annualBonus)) / 100
	}

	return clamp(person.annualBonus)
}

export const getTotalAnnualIncome = (person: PlannerPerson | undefined) => clamp(person?.annualSalary ?? 0) + getBonusAmount(person)

export const getPlannerHouseholdSnapshot = (people: PlannerPerson[]) => {
	const selfPerson = people.find((person) => person.type === 'self') ?? people[0]
	const spousePerson = people.find((person) => person.type === 'spouse')

	return {
		selfPerson,
		spousePerson,
		hasSpouse: Boolean(spousePerson),
		selfBirthday: selfPerson?.birthday ?? '',
		selfAnnualIncome: getTotalAnnualIncome(selfPerson),
		spouseAnnualIncome: getTotalAnnualIncome(spousePerson),
	}
}

export const getPlannerContributionTotals = (accounts: PlannerAccount[], selfAnnualIncome: number, spouseAnnualIncome: number) => {
	const totalPlannedMonthlyEmployee = accounts.reduce((sum, account) => sum + getEmployeeMonthlyContribution(account, selfAnnualIncome, spouseAnnualIncome), 0)
	const totalPlannedMonthlyMatch = accounts.reduce((sum, account) => sum + getEmployerMatchMonthly(account, selfAnnualIncome, spouseAnnualIncome), 0)

	return {
		totalPlannedMonthlyEmployee,
		totalPlannedMonthlyMatch,
		totalPlannedMonthlyInvestment: totalPlannedMonthlyEmployee + totalPlannedMonthlyMatch,
	}
}

export const getAnnualIncomeWithGrowth = (baseAnnualIncome: number, annualGrowthRate: number, elapsedYears: number) =>
	clamp(baseAnnualIncome) * (1 + annualGrowthRate / 100) ** Math.max(0, elapsedYears)

export const getEmployeeMonthlyContribution = (account: PlannerAccount, selfAnnualIncome: number, spouseAnnualIncome: number) => {
	if (isNonContributingAccountType(account.accountType)) {
		return 0
	}

	const ownerSalary = clamp(getOwnerAnnualIncome(account, selfAnnualIncome, spouseAnnualIncome))

	switch (account.contributionMode) {
		case 'yearly':
			return clamp(account.contributionValue) / 12
		case 'salary-percent':
			return (ownerSalary * (clamp(account.contributionValue) / 100)) / 12
		case 'monthly':
		default:
			return clamp(account.contributionValue)
	}
}

const getProjectedAnnualIrsLimit = (
	accountType: AccountType,
	ownerCurrentAge: number,
	elapsedYears: number,
	limits: IrsLimitConfig,
	hasSpouse: boolean,
	annualIrsLimitGrowthRate: number,
) => {
	const currentAnnualLimit = getSuggestedAnnualLimit(accountType, ownerCurrentAge, limits, hasSpouse)
	if (currentAnnualLimit <= 0) {
		return 0
	}

	const growthFactor = (1 + clamp(annualIrsLimitGrowthRate) / 100) ** Math.max(0, elapsedYears)
	return currentAnnualLimit * growthFactor
}

export const getEmployerMatchMonthlyFromAnnual = (account: PlannerAccount, ownerAnnualIncome: number, employeeAnnualContribution: number) => {
	if (account.accountType !== '401k') {
		return 0
	}

	const normalizedSalary = clamp(ownerAnnualIncome)
	if (normalizedSalary <= 0) {
		return 0
	}

	const matchableEmployeeAnnualContribution = normalizedSalary * (clamp(account.employerMatchMaxPercentOfSalary) / 100)
	const eligibleEmployeeAnnualContribution = Math.min(clamp(employeeAnnualContribution), matchableEmployeeAnnualContribution)
	const employerAnnualMatch = eligibleEmployeeAnnualContribution * (clamp(account.employerMatchRate) / 100)

	return employerAnnualMatch / 12
}

export const getEmployerMatchMonthly = (account: PlannerAccount, selfAnnualIncome: number, spouseAnnualIncome: number) => {
	const employeeAnnualContribution = getEmployeeMonthlyContribution(account, selfAnnualIncome, spouseAnnualIncome) * 12
	const ownerAnnualIncome = getOwnerAnnualIncome(account, selfAnnualIncome, spouseAnnualIncome)
	return getEmployerMatchMonthlyFromAnnual(account, ownerAnnualIncome, employeeAnnualContribution)
}

export const getTotalMonthlyForAccount = (account: PlannerAccount, selfAnnualIncome: number, spouseAnnualIncome: number) =>
	getEmployeeMonthlyContribution(account, selfAnnualIncome, spouseAnnualIncome) + getEmployerMatchMonthly(account, selfAnnualIncome, spouseAnnualIncome)

export const getProjection = (
	accounts: PlannerAccount[],
	currentAge: number,
	targetAge: number,
	selfAnnualIncome: number,
	spouseAnnualIncome: number,
	selfIncomeGrowthRate: number,
	spouseIncomeGrowthRate: number,
	assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
	irLimits: IrsLimitConfig,
	hasSpouse: boolean,
	annualIrsLimitGrowthRate: number,
	selfCurrentAge: number,
	spouseCurrentAge: number,
	inflationRatePercent: number,
	useInflationAdjustedValues: boolean,
) => {
	const years = Math.max(0, targetAge - currentAge)
	const now = new Date()
	const balances = accounts.map((account) => {
		if (isCombinedAssetType(account.accountType)) {
			const details = assetFinanceDetailsByAccountId[account.id]
			if (details) {
				return getAssetFinanceSnapshot(details, now).equity
			}
		}

		return getNetWorthStartingBalance(account)
	})

	const assetFinanceRuntimeState = accounts.map((account) => {
		if (!isCombinedAssetType(account.accountType)) {
			return null
		}

		const details = assetFinanceDetailsByAccountId[account.id]
		if (!details) {
			return null
		}

		const snapshot = getAssetFinanceSnapshot(details, now)
		return {
			accountType: account.accountType,
			assetValue: snapshot.assetValue,
			assetAnnualRate: details.annualChangeRate,
			homeGrowthProfile: details.homeGrowthProfile ?? plannerConstants.PLANNER_DEFAULT_HOME_GROWTH_PROFILE,
			vehicleDepreciationProfile: details.vehicleDepreciationProfile,
			monthsSincePurchase: snapshot.monthsSincePurchase,
			loanBalance: snapshot.loanBalance,
			hasLoan: details.hasLoan,
			loanMonthlyRate: clamp(details.loanInterestRate, 0) / 100 / 12,
			loanMonthlyPayment: clamp(details.loanMonthlyPayment),
			vehicleCustomAnnualRate: details.annualChangeRate,
			remainingLoanMonths: snapshot.remainingLoanMonths,
		}
	})

	const initialRowAccounts = balances.reduce(
		(series, balance, index) => ({
			...series,
			[`account-${index}`]: balance,
		}),
		{} as Record<`account-${number}`, number>,
	)
	const projectionRows: ProjectionRow[] = [
		{
			age: currentAge,
			totalBalance: balances.reduce((sum, balance) => sum + balance, 0),
			totalContributions: 0,
			...initialRowAccounts,
		},
	]

	let contributedTotal = 0

	for (let year = 1; year <= years; year++) {
		const yearSelfAnnualIncome = getAnnualIncomeWithGrowth(selfAnnualIncome, selfIncomeGrowthRate, year - 1)
		const yearSpouseAnnualIncome = getAnnualIncomeWithGrowth(spouseAnnualIncome, spouseIncomeGrowthRate, year - 1)
		const projectedContributionPlanByAccount = accounts.map((account) => {
			const ownerAnnualIncome = getOwnerAnnualIncome(account, yearSelfAnnualIncome, yearSpouseAnnualIncome)
			const annualEmployeeContribution = getEmployeeMonthlyContribution(account, yearSelfAnnualIncome, yearSpouseAnnualIncome) * 12
			const ownerCurrentAge = account.owner === 'spouse' ? spouseCurrentAge : selfCurrentAge
			const ownerAgeInProjectionYear = ownerCurrentAge + (year - 1)
			const projectedAnnualIrsLimit = getProjectedAnnualIrsLimit(account.accountType, ownerAgeInProjectionYear, year - 1, irLimits, hasSpouse, annualIrsLimitGrowthRate)
			const cappedAnnualEmployeeContribution = projectedAnnualIrsLimit > 0 ? Math.min(annualEmployeeContribution, projectedAnnualIrsLimit) : annualEmployeeContribution

			return {
				monthlyEmployeeContribution: cappedAnnualEmployeeContribution / 12,
				monthlyEmployerMatch: getEmployerMatchMonthlyFromAnnual(account, ownerAnnualIncome, cappedAnnualEmployeeContribution),
			}
		})

		for (let month = 0; month < 12; month++) {
			for (let index = 0; index < accounts.length; index++) {
				const account = accounts[index]
				const assetFinanceState = assetFinanceRuntimeState[index]

				if (assetFinanceState) {
					if (assetFinanceState.accountType === 'vehicle') {
						const vehicleAgeYears = assetFinanceState.monthsSincePurchase / 12
						const annualDepRate = getVehicleAnnualDepreciationRate(assetFinanceState.vehicleDepreciationProfile, vehicleAgeYears, assetFinanceState.vehicleCustomAnnualRate)
						const effectiveVehicleAnnualRate = getEffectiveAnnualRatePercent(-annualDepRate, inflationRatePercent, useInflationAdjustedValues)
						const monthlyVehicleRate = effectiveVehicleAnnualRate / 100 / 12
						assetFinanceState.assetValue = assetFinanceState.assetValue * (1 + monthlyVehicleRate)
					} else {
						const annualHomeRate = getHomeAnnualGrowthRate(assetFinanceState.homeGrowthProfile, assetFinanceState.assetAnnualRate)
						const effectiveHomeAnnualRate = getEffectiveAnnualRatePercent(annualHomeRate, inflationRatePercent, useInflationAdjustedValues)
						const monthlyHomeRate = effectiveHomeAnnualRate / 100 / 12
						assetFinanceState.assetValue = assetFinanceState.assetValue * (1 + monthlyHomeRate)
					}
					assetFinanceState.monthsSincePurchase += 1

					if (assetFinanceState.hasLoan && assetFinanceState.loanBalance > 0) {
						assetFinanceState.loanBalance = assetFinanceState.loanBalance * (1 + assetFinanceState.loanMonthlyRate) - assetFinanceState.loanMonthlyPayment
						if (assetFinanceState.loanBalance < 0) {
							assetFinanceState.loanBalance = 0
						}
						if (assetFinanceState.remainingLoanMonths > 0) {
							assetFinanceState.remainingLoanMonths -= 1
						}
						contributedTotal += assetFinanceState.loanMonthlyPayment
					}

					balances[index] = assetFinanceState.assetValue - assetFinanceState.loanBalance
					continue
				}

				const effectiveAnnualRate = getEffectiveAnnualRatePercent(account.annualRate, inflationRatePercent, useInflationAdjustedValues)
				const monthlyRate = clamp(effectiveAnnualRate, -99) / 100 / 12
				const projectedContributionPlan = projectedContributionPlanByAccount[index]
				const accountContribution = projectedContributionPlan.monthlyEmployeeContribution + projectedContributionPlan.monthlyEmployerMatch
				balances[index] = balances[index] * (1 + monthlyRate) + accountContribution
				contributedTotal += accountContribution
			}
		}

		projectionRows.push({
			age: currentAge + year,
			totalBalance: balances.reduce((sum, value) => sum + value, 0),
			totalContributions: contributedTotal,
			...balances.reduce(
				(series, balance, index) => ({
					...series,
					[`account-${index}`]: balance,
				}),
				{} as Record<`account-${number}`, number>,
			),
		})
	}

	return {
		projectionRows,
		finalBalances: balances,
	}
}

export const getDefaultAssetFinanceDetailsForAccount = (account: PlannerAccount): AssetFinanceDetails => {
	const isVehicle = account.accountType === 'vehicle'
	const currentValue = Math.max(clamp(account.startingBalance), 1)
	const annualChangeRate = isVehicle
		? -Math.max(Math.abs(account.annualRate), plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE)
		: account.annualRate || plannerConstants.PLANNER_DEFAULT_HOME_APPRECIATION_RATE

	return {
		purchaseDate: toIsoDate(new Date()),
		purchasePrice: currentValue,
		currentValue,
		annualChangeRate,
		homeGrowthProfile: isVehicle ? 'custom' : plannerConstants.PLANNER_DEFAULT_HOME_GROWTH_PROFILE,
		vehicleDepreciationProfile: isVehicle ? plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_PROFILE : 'custom',
		hasLoan: false,
		loanInterestRate: plannerConstants.PLANNER_DEFAULT_ASSET_LOAN_INTEREST_RATE,
		originalLoanAmount: 0,
		loanMonthlyPayment: 0,
		loanTermYears: isVehicle ? plannerConstants.PLANNER_DEFAULT_VEHICLE_LOAN_TERM_YEARS : plannerConstants.PLANNER_DEFAULT_HOME_LOAN_TERM_YEARS,
		loanStartDate: toIsoDate(new Date()),
		currentLoanBalance: 0,
	}
}

