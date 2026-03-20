'use client'
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react'

import type { UseMutationResult } from '@tanstack/react-query'

import * as plannerConfig from '../../lib/config'
import * as plannerConstants from '../../lib/constants'
import { clamp, getDefaultAssetFinanceDetailsForAccount, normalizeBonusMode } from '../../lib/plannerMath'
import { AccountType, ContributionMode, PlannerAccount } from '../../types/account'
import { AssetFinanceDetails, HomeGrowthProfile, VehicleDepreciationProfile } from '../../types/finance'
import { PersonType, PlannerPerson } from '../../types/person'
import { PlannerResponse, PlannerUpsertRequest } from '../../types/planner'

const { accountTypeOptions, contributionModeOptions, isCombinedAssetType } = plannerConfig

interface UsePlannerPersistenceParams {
	isSignedIn: boolean
	isPlannerLoading: boolean
	isPlannerError: boolean
	plannerData?: PlannerResponse
	putPlannerMutation: UseMutationResult<number, Error, PlannerUpsertRequest, unknown>
	createPlannerPayload: (
		nextDesiredInvestmentAmount: number,
		nextMonthlyExpenses: number,
		nextInflationRate: number,
		nextSafeWithdrawalRate: number,
		nextPeople: PlannerPerson[],
		nextAccounts: PlannerAccount[],
		nextAssetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
	) => PlannerUpsertRequest
	desiredInvestmentAmount: number
	monthlyExpenses: number
	inflationRate: number
	safeWithdrawalRate: number
	people: PlannerPerson[]
	accounts: PlannerAccount[]
	assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>
	setDesiredInvestmentAmount: Dispatch<SetStateAction<number>>
	setMonthlyExpenses: Dispatch<SetStateAction<number>>
	setInflationRate: (nextInflationRate: number) => void
	setSafeWithdrawalRate: (nextSafeWithdrawalRate: number) => void
	setPeople: Dispatch<SetStateAction<PlannerPerson[]>>
	setAccounts: Dispatch<SetStateAction<PlannerAccount[]>>
	setAssetFinanceDetailsByAccountId: Dispatch<SetStateAction<Record<string, AssetFinanceDetails>>>
}

interface UsePlannerPersistenceResult {
	hasPlannerSaveError: boolean
	lastPlannerSavedAt: Date | null
}

const usePlannerPersistence = ({
	isSignedIn,
	isPlannerLoading,
	isPlannerError,
	plannerData,
	putPlannerMutation,
	createPlannerPayload,
	desiredInvestmentAmount,
	monthlyExpenses,
	inflationRate,
	safeWithdrawalRate,
	people,
	accounts,
	assetFinanceDetailsByAccountId,
	setDesiredInvestmentAmount,
	setMonthlyExpenses,
	setInflationRate,
	setSafeWithdrawalRate,
	setPeople,
	setAccounts,
	setAssetFinanceDetailsByAccountId,
}: UsePlannerPersistenceParams): UsePlannerPersistenceResult => {
	const hasHydratedPlannerRef = useRef(false)
	const lastSavedPayloadRef = useRef('')
	const [hasPlannerSaveError, setHasPlannerSaveError] = useState(false)
	const [lastPlannerSavedAt, setLastPlannerSavedAt] = useState<Date | null>(null)

	useEffect(() => {
		if (!isSignedIn || hasHydratedPlannerRef.current || isPlannerLoading || isPlannerError) {
			return
		}

		if (plannerData && plannerData.monthlyExpenses > 0) {
			setMonthlyExpenses(clamp(plannerData.monthlyExpenses))
		}

		const hasExistingPlannerData = Boolean(plannerData && (plannerData.id > 0 || (plannerData.people ?? []).length > 0 || (plannerData.accounts ?? []).length > 0))

		if (hasExistingPlannerData && plannerData) {
			const hydratedDesiredInvestmentAmount = clamp(plannerData.desiredInvestmentAmount)
			const hydratedMonthlyExpenses = clamp(plannerData.monthlyExpenses)
			const nextDesiredInvestmentAmount = hydratedDesiredInvestmentAmount > 0 ? hydratedDesiredInvestmentAmount : plannerConstants.PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT
			const nextMonthlyExpenses = hydratedMonthlyExpenses > 0 ? hydratedMonthlyExpenses : plannerConstants.PLANNER_DEFAULT_MONTHLY_EXPENSES

			const mappedPeople: PlannerPerson[] = plannerData.people.map((person) => {
				const personType: PersonType = person.personType === 'spouse' ? 'spouse' : 'self'
				const bonusMode = normalizeBonusMode(person.bonusMode)
				const annualBonus = person.annualBonus ?? plannerConstants.PLANNER_DEFAULT_ANNUAL_BONUS
				const incomeGrowthRate = person.incomeGrowthRate ?? plannerConstants.PLANNER_DEFAULT_INCOME_GROWTH_RATE

				return {
					id: crypto.randomUUID(),
					type: personType,
					name: person.name,
					birthday: person.birthday?.slice(0, 10) ?? '',
					retirementAge: clamp(person.retirementAge),
					annualSalary: clamp(person.annualSalary),
					bonusMode,
					annualBonus: clamp(annualBonus),
					incomeGrowthRate,
				}
			})

			const mappedAccounts: PlannerAccount[] = plannerData.accounts.map((account, index) => {
				const normalizedAccountType = accountTypeOptions.find((option) => option.value === (account.accountType as AccountType))?.value ?? ('other' as AccountType)
				const normalizedOwner = account.owner === 'spouse' ? 'spouse' : 'self'
				const normalizedContributionMode =
					contributionModeOptions.find((option) => option.value === (account.contributionMode as ContributionMode))?.value ?? ('monthly' as ContributionMode)

				return {
					id: `${account.owner}-${normalizedAccountType}-${account.name}-${index}`,
					name: account.name,
					owner: normalizedOwner,
					accountType: normalizedAccountType,
					contributionMode: normalizedContributionMode,
					contributionValue: clamp(account.contributionValue),
					employerMatchRate: clamp(account.employerMatchRate),
					employerMatchMaxPercentOfSalary: clamp(account.employerMatchMaxPercentOfSalary),
					startingBalance: clamp(account.startingBalance),
					annualRate: account.annualRate,
				}
			})

			setDesiredInvestmentAmount(nextDesiredInvestmentAmount)
			setMonthlyExpenses(nextMonthlyExpenses)
			// Inflation and SWR are user preference values from CurrentUser context.
			// Do not overwrite them from planner payload hydration.

			if (mappedPeople.length > 0) {
				setPeople(mappedPeople)
			}

			if (mappedAccounts.length > 0) {
				setAccounts(mappedAccounts)
				setAssetFinanceDetailsByAccountId((prev) => {
					const next = { ...prev }

					for (let i = 0; i < mappedAccounts.length; i += 1) {
						const mappedAccount = mappedAccounts[i]
						const apiAccount = plannerData.accounts[i]

						if (!isCombinedAssetType(mappedAccount.accountType)) {
							continue
						}

						const fallback = getDefaultAssetFinanceDetailsForAccount(mappedAccount)

						next[mappedAccount.id] = {
							purchaseDate: apiAccount.purchaseDate?.slice(0, 10) ?? fallback.purchaseDate,
							purchasePrice: clamp(apiAccount.purchasePrice ?? fallback.purchasePrice),
							currentValue: clamp(apiAccount.currentValue ?? mappedAccount.startingBalance),
							annualChangeRate: apiAccount.annualChangeRate ?? mappedAccount.annualRate,
							homeGrowthProfile: (apiAccount.homeGrowthProfile as HomeGrowthProfile | undefined) ?? fallback.homeGrowthProfile,
							vehicleDepreciationProfile: (apiAccount.vehicleDepreciationProfile as VehicleDepreciationProfile | undefined) ?? fallback.vehicleDepreciationProfile,
							hasLoan: apiAccount.hasLoan ?? fallback.hasLoan,
							loanInterestRate: apiAccount.loanInterestRate ?? fallback.loanInterestRate,
							originalLoanAmount: clamp(apiAccount.originalLoanAmount ?? fallback.originalLoanAmount),
							loanMonthlyPayment: clamp(apiAccount.loanMonthlyPayment ?? fallback.loanMonthlyPayment),
							loanTermYears: apiAccount.loanTermYears ?? fallback.loanTermYears,
							loanStartDate: apiAccount.loanStartDate?.slice(0, 10) ?? fallback.loanStartDate,
							currentLoanBalance: clamp(apiAccount.currentLoanBalance ?? fallback.currentLoanBalance),
						}
					}

					return next
				})
			}

			lastSavedPayloadRef.current = JSON.stringify(
				createPlannerPayload(
					nextDesiredInvestmentAmount,
					nextMonthlyExpenses,
					inflationRate,
					safeWithdrawalRate,
					mappedPeople.length > 0 ? mappedPeople : people,
					mappedAccounts.length > 0 ? mappedAccounts : accounts,
					assetFinanceDetailsByAccountId,
				),
			)
		} else {
			lastSavedPayloadRef.current = JSON.stringify(
				createPlannerPayload(
					desiredInvestmentAmount,
					plannerData && plannerData.monthlyExpenses > 0 ? clamp(plannerData.monthlyExpenses) : monthlyExpenses,
					inflationRate,
					safeWithdrawalRate,
					people,
					accounts,
					assetFinanceDetailsByAccountId,
				),
			)
		}

		hasHydratedPlannerRef.current = true
	}, [
		isSignedIn,
		isPlannerLoading,
		isPlannerError,
		plannerData,
		createPlannerPayload,
		desiredInvestmentAmount,
		monthlyExpenses,
		inflationRate,
		safeWithdrawalRate,
		people,
		accounts,
		assetFinanceDetailsByAccountId,
		setDesiredInvestmentAmount,
		setMonthlyExpenses,
		setInflationRate,
		setSafeWithdrawalRate,
		setPeople,
		setAccounts,
		setAssetFinanceDetailsByAccountId,
	])

	useEffect(() => {
		if (!isSignedIn || !hasHydratedPlannerRef.current || putPlannerMutation.isPending) {
			return
		}

		const payload = createPlannerPayload(desiredInvestmentAmount, monthlyExpenses, inflationRate, safeWithdrawalRate, people, accounts, assetFinanceDetailsByAccountId)
		const serializedPayload = JSON.stringify(payload)

		if (serializedPayload === lastSavedPayloadRef.current) {
			return
		}

		const saveTimeout = window.setTimeout(() => {
			putPlannerMutation.mutate(payload, {
				onSuccess: () => {
					lastSavedPayloadRef.current = serializedPayload
					setHasPlannerSaveError(false)
					setLastPlannerSavedAt(new Date())
				},
				onError: () => {
					setHasPlannerSaveError(true)
				},
			})
		}, plannerConstants.PLANNER_AUTOSAVE_DEBOUNCE_MS)

		return () => {
			window.clearTimeout(saveTimeout)
		}
	}, [
		isSignedIn,
		desiredInvestmentAmount,
		monthlyExpenses,
		inflationRate,
		safeWithdrawalRate,
		people,
		accounts,
		assetFinanceDetailsByAccountId,
		createPlannerPayload,
		putPlannerMutation,
	])

	return {
		hasPlannerSaveError,
		lastPlannerSavedAt,
	}
}

export default usePlannerPersistence

