import { useMemo } from 'react'

import * as plannerConfig from '../../lib/config'
import * as plannerConstants from '../../lib/constants'

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'
import {
	clamp,
	getAccountAnnualRateFromProfile,
	getAccountRateProfileFromAnnualRate,
	getAgeFromBirthday,
	getAssetFinanceSnapshot,
	getDefaultAssetFinanceDetailsForAccount,
	getDisplayedRatePercent,
	getEmployeeMonthlyContribution,
	getEmployerMatchMonthly,
	getHomeAnnualGrowthRate,
	getPlannerContributionTotals,
	getPlannerHouseholdSnapshot,
	getRealAnnualRatePercent,
	getStoredAnnualRateFromInput,
	getSuggestedAnnualLimit,
	toIsoDate,
} from '../../lib/plannerMath'
import { AccountRateProfile, AccountType, PlannerAccount } from '../../types/account'
import { AssetFinanceDetails } from '../../types/finance'
import useIrsLimits from './useIrsLimits'

const {
	accountOwnerOptions,
	accountTypeOptions,
	contributionModeOptions,
	homeGrowthProfileOptions,
	isCombinedAssetType,
	isDepreciatingAssetType,
	isLiabilityAccountType,
	isNonContributingAccountType,
	liabilityContributionModeOptions,
	vehicleDepreciationProfileOptions,
} = plannerConfig

const usePlannerAccounts = () => {
	const {
		plannerSummary,
		plannerAccounts,
		setPlannerAccounts,
		plannerAssetFinanceDetailsByAccountId,
		setPlannerAssetFinanceDetailsByAccountId,
		plannerPeople,
		returnDisplayMode,
		inflationRate,
	} = useCurrentUser()
	const { irsLimits, isIrsAccountsLoading, isIrsAccountsError } = useIrsLimits()

	const useInflationAdjustedValues = returnDisplayMode === 'real'
	const people = plannerPeople
	const { hasSpouse, selfBirthday, selfAnnualIncome, spouseAnnualIncome } = getPlannerHouseholdSnapshot(people)

	const accountRateProfileOptions = useMemo(
		() =>
			plannerConfig.accountRateProfileOptions.map((option) => {
				if (option.value === 'custom') {
					return option
				}

				const nominalRate = plannerConstants.PLANNER_ACCOUNT_RATE_PROFILE_RATES[option.value]
				const displayRate = useInflationAdjustedValues ? getRealAnnualRatePercent(nominalRate, inflationRate) : nominalRate
				const labelPrefix = option.label.split(' (')[0]

				return {
					...option,
					label: `${labelPrefix} (${displayRate.toFixed(1)}%)`,
				}
			}),
		[inflationRate, useInflationAdjustedValues],
	)

	const getDisplayedRateForAccount = (account: PlannerAccount) => getDisplayedRatePercent(account, inflationRate, useInflationAdjustedValues)
	const getStoredAnnualRateForInput = (account: PlannerAccount, value: number) => getStoredAnnualRateFromInput(account, value, inflationRate, useInflationAdjustedValues)
	const getRateProfileFromAnnualRate = (annualRate: number) => getAccountRateProfileFromAnnualRate(annualRate, inflationRate, useInflationAdjustedValues)
	const getAnnualRateFromProfile = (profile: AccountRateProfile, currentAnnualRate: number) =>
		getAccountAnnualRateFromProfile(profile, currentAnnualRate, inflationRate, useInflationAdjustedValues)
	const getSuggestedAnnualLimitForAccount = (accountType: AccountType, age: number, includeSpouse: boolean) => getSuggestedAnnualLimit(accountType, age, irsLimits, includeSpouse)

	const {
		totalPlannedMonthlyEmployee,
		totalPlannedMonthlyMatch,
		totalPlannedMonthlyInvestment: computedTotalPlannedMonthlyInvestment,
	} = useMemo(() => getPlannerContributionTotals(plannerAccounts, selfAnnualIncome, spouseAnnualIncome), [plannerAccounts, selfAnnualIncome, spouseAnnualIncome])
	const totalPlannedMonthlyInvestment = plannerSummary?.totalPlannedMonthlyInvestment ?? computedTotalPlannedMonthlyInvestment
	const weightedAnnualRate = plannerSummary?.weightedAnnualRate ?? 0

	const updateAccount = (id: string, updater: (account: PlannerAccount) => PlannerAccount) => {
		setPlannerAccounts((prev) => prev.map((account) => (account.id === id ? updater(account) : account)))
	}

	const updateAssetFinanceDetails = (accountId: string, updater: (details: AssetFinanceDetails) => AssetFinanceDetails) => {
		setPlannerAssetFinanceDetailsByAccountId((prev) => {
			const fallbackAccount = plannerAccounts.find((account) => account.id === accountId)
			const fallback = fallbackAccount
				? getDefaultAssetFinanceDetailsForAccount(fallbackAccount)
				: getDefaultAssetFinanceDetailsForAccount({
						id: accountId,
						name: 'Asset',
						owner: 'self',
						accountType: 'home',
						contributionMode: 'monthly',
						contributionValue: 0,
						employerMatchRate: 0,
						employerMatchMaxPercentOfSalary: 0,
						startingBalance: 1,
						annualRate: 4,
					})
			const nextDetails = updater(prev[accountId] ?? fallback)

			updateAccount(accountId, (current) => ({
				...current,
				startingBalance: clamp(nextDetails.currentValue),
				annualRate: nextDetails.annualChangeRate,
			}))

			return {
				...prev,
				[accountId]: nextDetails,
			}
		})
	}

	const removeAccount = (id: string) => {
		if (plannerAccounts.length === 1) {
			return
		}

		setPlannerAccounts((prev) => prev.filter((account) => account.id !== id))
		setPlannerAssetFinanceDetailsByAccountId((prev) => {
			if (!prev[id]) {
				return prev
			}

			const next = { ...prev }
			delete next[id]
			return next
		})
	}

	const addAccount = () => {
		setPlannerAccounts((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				name: `Account ${prev.length + 1}`,
				...plannerConstants.PLANNER_DEFAULT_NEW_ACCOUNT,
				annualRate: weightedAnnualRate,
			},
		])
	}

	const addLiability = () => {
		const newAccount: PlannerAccount = {
			id: crypto.randomUUID(),
			name: `Liability ${plannerAccounts.length + 1}`,
			owner: 'self',
			accountType: 'student-loan',
			contributionMode: 'monthly',
			contributionValue: 500,
			employerMatchRate: 0,
			employerMatchMaxPercentOfSalary: 0,
			startingBalance: 25000,
			annualRate: 6,
		}

		setPlannerAccounts((prev) => [...prev, newAccount])
	}

	return {
		plannerAccounts,
		assetFinanceDetailsByAccountId: plannerAssetFinanceDetailsByAccountId,
		people,
		hasSpouse,
		selfBirthday,
		selfAnnualIncome,
		spouseAnnualIncome,
		isIrsAccountsLoading,
		isIrsAccountsError,
		totalPlannedMonthlyEmployee,
		totalPlannedMonthlyMatch,
		totalPlannedMonthlyInvestment,
		accountOwnerOptions,
		accountRateProfileOptions,
		accountTypeOptions,
		contributionModeOptions,
		liabilityContributionModeOptions,
		homeGrowthProfileOptions,
		vehicleDepreciationProfileOptions,
		defaultHomeGrowthProfile: plannerConstants.PLANNER_DEFAULT_HOME_GROWTH_PROFILE,
		defaultVehicleDepreciationProfile: plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_PROFILE,
		defaultHomeAppreciationRate: plannerConstants.PLANNER_DEFAULT_HOME_APPRECIATION_RATE,
		defaultVehicleDepreciationRate: plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE,
		isLiabilityAccountType,
		isCombinedAssetType,
		isNonContributingAccountType,
		isDepreciatingAssetType,
		getEmployeeMonthlyContribution,
		getEmployerMatchMonthly,
		getSuggestedAnnualLimitForAccount,
		getDisplayedRateForAccount,
		getStoredAnnualRateForInput,
		getRateProfileFromAnnualRate,
		getAnnualRateFromProfile,
		getAssetFinanceSnapshot,
		getDefaultAssetFinanceDetailsForAccount,
		getHomeAnnualGrowthRate,
		getAgeFromBirthday,
		toIsoDate,
		updateAccount,
		updateAssetFinanceDetails,
		removeAccount,
		addAccount,
		addLiability,
		setPlannerAssetFinanceDetailsByAccountId,
	}
}

export default usePlannerAccounts

