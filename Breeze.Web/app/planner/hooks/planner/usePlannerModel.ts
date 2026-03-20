'use client'
import { useEffect, useMemo } from 'react'

import type { ChartConfig } from '@/components/ui/chart'
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'
import * as plannerConfig from '../../lib/config'
import * as plannerConstants from '../../lib/constants'
import {
	accountLineColors,
	clamp,
	getAgeFromBirthday,
	getAnnualIncomeWithGrowth,
	getAssetFinanceSnapshot,
	getEffectiveAnnualRatePercent,
	getEmployeeMonthlyContribution,
	getEmployerMatchMonthly,
	getFinancialMathSnapshot,
	getMonthlyContribution,
	getNetWorthStartingBalance,
	getPlannerContributionTotals,
	getPlannerHouseholdSnapshot,
	getProjection,
	getSuggestedAnnualLimit,
	getSuggestedSafeWithdrawalRate,
	getTotalMonthlyForAccount,
	plannerChartConfig,
} from '../../lib/plannerMath'
import useIrsLimits from './useIrsLimits'

const { accountTypeOptions, isCombinedAssetType, isLiabilityAccountType } = plannerConfig

const usePlannerModel = () => {
	const {
		returnDisplayMode,
		inflationRate,
		safeWithdrawalRate,
		setPlannerSummary,
		plannerDesiredInvestmentAmount,
		plannerMonthlyExpenses,
		plannerRetirementMethod,
		plannerFireLifestyleIndex,
		plannerPeople,
		plannerAccounts,
		plannerAssetFinanceDetailsByAccountId,
	} = useCurrentUser()
	const { irsLimits } = useIrsLimits()

	const useInflationAdjustedValues = returnDisplayMode === 'real'
	const desiredInvestmentAmount = plannerDesiredInvestmentAmount
	const monthlyExpenses = plannerMonthlyExpenses
	const retirementMethod = plannerRetirementMethod
	const fireLifestyleIndex = plannerFireLifestyleIndex
	const people = plannerPeople
	const accounts = plannerAccounts
	const assetFinanceDetailsByAccountId = plannerAssetFinanceDetailsByAccountId

	const { selfPerson, spousePerson, hasSpouse, selfAnnualIncome, spouseAnnualIncome } = useMemo(() => getPlannerHouseholdSnapshot(people), [people])
	const selfIncomeGrowthRate = selfPerson?.incomeGrowthRate ?? plannerConstants.PLANNER_DEFAULT_INCOME_GROWTH_RATE
	const spouseIncomeGrowthRate = spousePerson?.incomeGrowthRate ?? plannerConstants.PLANNER_DEFAULT_INCOME_GROWTH_RATE
	const currentAge = selfPerson ? getAgeFromBirthday(selfPerson.birthday) : 0
	const targetAge = people.length > 0 ? Math.max(...people.map((person) => person.retirementAge)) : currentAge
	const yearsToGoal = Math.max(0, targetAge - currentAge)

	const totalStartingBalance = useMemo(
		() =>
			accounts.reduce((sum, account) => {
				if (isCombinedAssetType(account.accountType)) {
					const details = assetFinanceDetailsByAccountId[account.id]
					if (details) {
						return sum + getAssetFinanceSnapshot(details, new Date()).equity
					}
				}

				return sum + getNetWorthStartingBalance(account)
			}, 0),
		[accounts, assetFinanceDetailsByAccountId],
	)

	const totalAssets = useMemo(
		() =>
			accounts
				.filter((account) => !isLiabilityAccountType(account.accountType))
				.reduce((sum, account) => {
					if (isCombinedAssetType(account.accountType)) {
						return sum + clamp(assetFinanceDetailsByAccountId[account.id]?.currentValue ?? account.startingBalance)
					}

					return sum + clamp(account.startingBalance)
				}, 0),
		[accounts, assetFinanceDetailsByAccountId],
	)

	const totalLiabilities = useMemo(
		() =>
			accounts.reduce((sum, account) => {
				if (isLiabilityAccountType(account.accountType)) {
					return sum + clamp(account.startingBalance)
				}

				if (isCombinedAssetType(account.accountType)) {
					const details = assetFinanceDetailsByAccountId[account.id]
					if (details?.hasLoan) {
						return sum + clamp(details.currentLoanBalance)
					}
				}

				return sum
			}, 0),
		[accounts, assetFinanceDetailsByAccountId],
	)

	const { totalPlannedMonthlyEmployee, totalPlannedMonthlyInvestment } = useMemo(
		() => getPlannerContributionTotals(accounts, selfAnnualIncome, spouseAnnualIncome),
		[accounts, selfAnnualIncome, spouseAnnualIncome],
	)
	const annualHouseholdIncome = selfAnnualIncome + spouseAnnualIncome
	const currentSavingsRateEmployeePercent = annualHouseholdIncome > 0 ? (totalPlannedMonthlyEmployee * 12 * 100) / annualHouseholdIncome : 0
	const currentSavingsRateTotalPercent = annualHouseholdIncome > 0 ? (totalPlannedMonthlyInvestment * 12 * 100) / annualHouseholdIncome : 0

	const weightedAnnualRate = useMemo(() => {
		const totalWeightedContribution = accounts.reduce((sum, account) => sum + getTotalMonthlyForAccount(account, selfAnnualIncome, spouseAnnualIncome), 0)
		if (totalWeightedContribution === 0) {
			return accounts.length > 0 ? accounts.reduce((sum, account) => sum + account.annualRate, 0) / accounts.length : 0
		}

		return accounts.reduce((sum, account) => sum + (getTotalMonthlyForAccount(account, selfAnnualIncome, spouseAnnualIncome) / totalWeightedContribution) * account.annualRate, 0)
	}, [accounts, selfAnnualIncome, spouseAnnualIncome])

	const effectiveWeightedAnnualRate = useMemo(
		() => getEffectiveAnnualRatePercent(weightedAnnualRate, inflationRate, useInflationAdjustedValues),
		[weightedAnnualRate, inflationRate, useInflationAdjustedValues],
	)

	const annualNeedToday = monthlyExpenses * 12
	const inflationFactor = (1 + inflationRate / 100) ** yearsToGoal
	const annualNeedAtRetirement = useInflationAdjustedValues ? annualNeedToday : annualNeedToday * inflationFactor
	const baseFinancialFreedomTarget = safeWithdrawalRate > 0 ? annualNeedAtRetirement / (safeWithdrawalRate / 100) : 0
	const retirementHorizonYears = Math.max(1, plannerConstants.PLANNER_DEFAULT_LONGEVITY_AGE - targetAge)
	const suggestedSafeWithdrawalRate = getSuggestedSafeWithdrawalRate(retirementHorizonYears)
	const inflationDecimal = inflationRate / 100
	const getRealGrowthRatePercent = (nominalGrowthRatePercent: number) => {
		if (inflationDecimal <= -1) {
			return nominalGrowthRatePercent
		}

		return ((1 + nominalGrowthRatePercent / 100) / (1 + inflationDecimal) - 1) * 100
	}
	const selfEffectiveIncomeGrowthRate = useInflationAdjustedValues ? getRealGrowthRatePercent(selfIncomeGrowthRate) : selfIncomeGrowthRate
	const spouseEffectiveIncomeGrowthRate = useInflationAdjustedValues ? getRealGrowthRatePercent(spouseIncomeGrowthRate) : spouseIncomeGrowthRate
	const selfAnnualIncomeAtRetirement = getAnnualIncomeWithGrowth(selfAnnualIncome, selfEffectiveIncomeGrowthRate, yearsToGoal)
	const spouseAnnualIncomeAtRetirement = getAnnualIncomeWithGrowth(spouseAnnualIncome, spouseEffectiveIncomeGrowthRate, yearsToGoal)
	const projectedHouseholdIncomeAtRetirement = selfAnnualIncomeAtRetirement + spouseAnnualIncomeAtRetirement
	// Income replacement is based on current income in today's dollars, then adjusted for real vs nominal
	// the same way FIRE targets are — this keeps the income guide chip proportional to FIRE tiers.
	const incomeReplacementAnnualNeedToday = annualHouseholdIncome * (plannerConstants.PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE / 100)
	const incomeReplacementAnnualNeed = useInflationAdjustedValues ? incomeReplacementAnnualNeedToday : incomeReplacementAnnualNeedToday * inflationFactor
	const incomeReplacementTarget = safeWithdrawalRate > 0 ? incomeReplacementAnnualNeed / (safeWithdrawalRate / 100) : 0
	const fireTargets = useMemo(
		() =>
			plannerConstants.PLANNER_FIRE_LIFESTYLE_OPTIONS.map((option) => ({
				label: option.label,
				target: baseFinancialFreedomTarget * option.multiplier,
				monthlySpendSupported: safeWithdrawalRate > 0 ? (baseFinancialFreedomTarget * option.multiplier * (safeWithdrawalRate / 100)) / 12 : 0,
			})),
		[baseFinancialFreedomTarget, safeWithdrawalRate],
	)
	const safeFireLifestyleIndex = Math.max(0, Math.min(fireLifestyleIndex, fireTargets.length - 1))
	const fireTarget = fireTargets[safeFireLifestyleIndex]?.target ?? baseFinancialFreedomTarget
	const annualReturnFactor = 1 + effectiveWeightedAnnualRate / 100
	const coastFireTargetToday = annualReturnFactor > 0 ? fireTarget / annualReturnFactor ** yearsToGoal : fireTarget
	const coastFireGap = totalStartingBalance - coastFireTargetToday
	const hasReachedCoastFire = plannerConstants.isMoneyGreaterThanOrEqualWithTolerance(coastFireGap, 0)
	const selectedRetirementTarget = retirementMethod === 'target-amount' ? desiredInvestmentAmount : retirementMethod === 'income-replacement' ? incomeReplacementTarget : fireTarget
	const selectedRetirementMethodLabel = plannerConstants.PLANNER_RETIREMENT_METHOD_OPTIONS.find((option) => option.value === retirementMethod)?.label ?? 'Selected Method'
	const financialFreedomTarget = fireTarget

	const monthlyNeededForDesiredTarget = getMonthlyContribution(selectedRetirementTarget, totalStartingBalance, effectiveWeightedAnnualRate, yearsToGoal)
	const monthlyNeededForFreedomTarget = getMonthlyContribution(financialFreedomTarget, totalStartingBalance, effectiveWeightedAnnualRate, yearsToGoal)
	const requiredSavingsRatePercent = annualHouseholdIncome > 0 ? (monthlyNeededForDesiredTarget * 12 * 100) / annualHouseholdIncome : 0
	const savingsRateGapPercent = currentSavingsRateTotalPercent - requiredSavingsRatePercent

	const { projectionRows, finalBalances } = useMemo(
		() =>
			getProjection(
				accounts,
				currentAge,
				targetAge,
				selfAnnualIncome,
				spouseAnnualIncome,
				selfIncomeGrowthRate,
				spouseIncomeGrowthRate,
				assetFinanceDetailsByAccountId,
				irsLimits,
				hasSpouse,
				plannerConstants.PLANNER_DEFAULT_IRS_LIMIT_GROWTH_RATE,
				currentAge,
				spousePerson ? getAgeFromBirthday(spousePerson.birthday) : currentAge,
				inflationRate,
				useInflationAdjustedValues,
			),
		[
			accounts,
			currentAge,
			targetAge,
			selfAnnualIncome,
			spouseAnnualIncome,
			selfIncomeGrowthRate,
			spouseIncomeGrowthRate,
			assetFinanceDetailsByAccountId,
			irsLimits,
			hasSpouse,
			spousePerson,
			inflationRate,
			useInflationAdjustedValues,
		],
	)

	const projectedNetWorthAtTargetAge = projectionRows[projectionRows.length - 1]?.totalBalance ?? totalStartingBalance
	const financialFreedomAge = useMemo(() => {
		const firstFreedomRow = projectionRows.find((row) => row.totalBalance >= financialFreedomTarget)
		return firstFreedomRow?.age ?? null
	}, [projectionRows, financialFreedomTarget])

	const accountBreakdownRows = useMemo(
		() =>
			accounts.map((account, index) => {
				const employeeMonthly = getEmployeeMonthlyContribution(account, selfAnnualIncome, spouseAnnualIncome)
				const annualEmployee = employeeMonthly * 12
				const ownerBirthday = people.find((person) => person.type === account.owner)?.birthday ?? selfPerson?.birthday ?? ''
				const ownerAge = getAgeFromBirthday(ownerBirthday)
				const suggestedLimit = getSuggestedAnnualLimit(account.accountType, ownerAge, irsLimits, hasSpouse)
				const exceedsLimit = suggestedLimit > 0 && plannerConstants.isMoneyGreaterThanWithTolerance(annualEmployee, suggestedLimit)
				const matchMonthly = getEmployerMatchMonthly(account, selfAnnualIncome, spouseAnnualIncome)
				const accountTypeLabel = accountTypeOptions.find((option) => option.value === account.accountType)?.label ?? 'Other'
				const ownerLabel = account.owner === 'spouse' ? 'Spouse' : 'Self'

				return {
					id: account.id,
					name: account.name,
					ownerLabel,
					accountTypeLabel,
					employeeMonthly,
					matchMonthly,
					totalMonthly: employeeMonthly + matchMonthly,
					annualEmployee,
					suggestedLimit,
					exceedsLimit,
					projectedValue: finalBalances[index] ?? 0,
				}
			}),
		[accounts, selfAnnualIncome, spouseAnnualIncome, people, selfPerson, irsLimits, hasSpouse, finalBalances],
	)

	const dynamicChartConfig = useMemo(() => {
		const accountEntries = Object.fromEntries(
			accounts.map((account, index) => [
				`account-${index}`,
				{
					label: account.name,
					color: accountLineColors[index % accountLineColors.length],
				},
			]),
		)

		return {
			...plannerChartConfig,
			...accountEntries,
		} satisfies ChartConfig
	}, [accounts])

	const monthlyGapToGoal = totalPlannedMonthlyInvestment - monthlyNeededForDesiredTarget
	const isMonthlyGapPositive = plannerConstants.isMoneyGreaterThanOrEqualWithTolerance(monthlyGapToGoal, 0)
	const financialMathSnapshot = useMemo(
		() =>
			getFinancialMathSnapshot({
				monthlyExpenses,
				selfSalary: selfAnnualIncome,
				spouseSalary: spouseAnnualIncome,
				safeWithdrawalRate,
				currentPortfolio: totalStartingBalance,
			}),
		[monthlyExpenses, selfAnnualIncome, spouseAnnualIncome, safeWithdrawalRate, totalStartingBalance],
	)

	useEffect(() => {
		setPlannerSummary({
			monthlyNeededForDesiredTarget,
			requiredMonthlyTargetLabel: selectedRetirementMethodLabel,
			annualHouseholdIncome,
			currentSavingsRateEmployeePercent,
			currentSavingsRateTotalPercent,
			requiredSavingsRatePercent,
			savingsRateGapPercent,
			weightedAnnualRate: effectiveWeightedAnnualRate,
			yearsToGoal,
			monthlyGapToGoal,
			isMonthlyGapPositive,
			totalStartingBalance,
			totalAssets,
			totalLiabilities,
			targetAge,
			projectedNetWorthAtTargetAge,
			totalPlannedMonthlyInvestment,
			annualNeedAtRetirement,
			financialFreedomTarget,
			monthlyNeededForFreedomTarget,
		})
	}, [
		monthlyNeededForDesiredTarget,
		selectedRetirementMethodLabel,
		annualHouseholdIncome,
		currentSavingsRateEmployeePercent,
		currentSavingsRateTotalPercent,
		requiredSavingsRatePercent,
		savingsRateGapPercent,
		effectiveWeightedAnnualRate,
		yearsToGoal,
		monthlyGapToGoal,
		isMonthlyGapPositive,
		totalStartingBalance,
		totalAssets,
		totalLiabilities,
		targetAge,
		projectedNetWorthAtTargetAge,
		totalPlannedMonthlyInvestment,
		annualNeedAtRetirement,
		financialFreedomTarget,
		monthlyNeededForFreedomTarget,
		setPlannerSummary,
	])

	return {
		accounts,
		currentAge,
		financialMathSnapshot,
		projectionRows,
		accountBreakdownRows,
		dynamicChartConfig,
		fireTargets,
		baseFinancialFreedomTarget,
		retirementHorizonYears,
		suggestedSafeWithdrawalRate,
		financialFreedomAge,
		coastFireTargetToday,
		coastFireGap,
		hasReachedCoastFire,
		projectedHouseholdIncomeAtRetirement,
		incomeReplacementAnnualNeed,
		incomeReplacementTarget,
	}
}

export default usePlannerModel

