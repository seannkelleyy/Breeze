'use client'
import { type ReactNode, useEffect, useMemo } from 'react'

import { formatCurrencyWithCode } from '../lib/plannerMath'
import { FormattedNumberInput } from '../../../components/common/form/FormattedNumberInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FinancialMathSnapshot } from '../types/finance'
import { PLANNER_FIRE_LIFESTYLE_OPTIONS } from '../lib/constants'
import { usePlannerRetirementInputs } from '../hooks/planner/index'
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'

export type RetirementInputsCardProps = {
	collapsed: boolean
	toggleControl: ReactNode
	fireTargets: ReadonlyArray<{ label: string; target: number; monthlySpendSupported: number }>
	baseFinancialFreedomTarget: number
	retirementHorizonYears: number
	suggestedSafeWithdrawalRate: number
	financialFreedomAge: number | null
	coastFireTargetToday: number
	coastFireGap: number
	hasReachedCoastFire: boolean
	incomeReplacementRate: number
	projectedHouseholdIncomeAtRetirement: number
	incomeReplacementAnnualNeed: number
	incomeReplacementTarget: number
	financialMathSnapshot: FinancialMathSnapshot
}

export const RetirementInputsCard = ({
	collapsed,
	toggleControl,
	fireTargets,
	baseFinancialFreedomTarget,
	retirementHorizonYears,
	suggestedSafeWithdrawalRate,
	financialFreedomAge,
	coastFireTargetToday,
	coastFireGap,
	hasReachedCoastFire,
	incomeReplacementRate,
	projectedHouseholdIncomeAtRetirement,
	incomeReplacementAnnualNeed,
	incomeReplacementTarget,
	financialMathSnapshot,
}: RetirementInputsCardProps) => {
	const { isSignedIn, currencyCode, returnDisplayMode, inflationRate, safeWithdrawalRate, plannerSummary } = useCurrentUser()
	const {
		desiredInvestmentAmount,
		setDesiredInvestmentAmount,
		monthlyExpenses,
		setMonthlyExpenses,
		retirementMethod,
		setRetirementMethod,
		isRefreshingExpenses,
		refreshMonthlyExpenses,
	} = usePlannerRetirementInputs()
	const fireLifestyleOptions = PLANNER_FIRE_LIFESTYLE_OPTIONS
	const yearsToGoal = plannerSummary?.yearsToGoal ?? 0
	const annualNeedAtRetirement = plannerSummary?.annualNeedAtRetirement ?? 0
	const useInflationAdjustedValues = returnDisplayMode === 'real'
	const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode)
	const safeFireIndex = useMemo(() => {
		if (fireTargets.length === 0) {
			return 0
		}

		let closestIndex = 0
		let closestDistance = Math.abs(fireTargets[0].target - desiredInvestmentAmount)

		for (let i = 1; i < fireTargets.length; i += 1) {
			const distance = Math.abs(fireTargets[i].target - desiredInvestmentAmount)
			if (distance < closestDistance) {
				closestDistance = distance
				closestIndex = i
			}
		}

		return Math.max(0, Math.min(closestIndex, fireLifestyleOptions.length - 1))
	}, [fireTargets, desiredInvestmentAmount, fireLifestyleOptions.length])
	const selectedFireLabel = fireLifestyleOptions[safeFireIndex]?.label ?? 'Standard FIRE'
	const selectedFireMultiplier = fireLifestyleOptions[safeFireIndex]?.multiplier ?? 1
	const selectedFireTarget = fireTargets[safeFireIndex]?.target ?? baseFinancialFreedomTarget
	const selectedFireScenario = financialMathSnapshot.scenarios[safeFireIndex]

	const targetGuideItems = useMemo(
		() =>
			[...fireTargets.map((target) => ({ label: target.label, target: target.target })), { label: 'Income', target: incomeReplacementTarget }]
				.filter((item) => item.target > 0)
				.sort((left, right) => left.target - right.target),
		[fireTargets, incomeReplacementTarget],
	)

	const sliderMin = targetGuideItems[0]?.target ?? 0
	const sliderMax = targetGuideItems[targetGuideItems.length - 1]?.target ?? Math.max(1, desiredInvestmentAmount)
	const sliderAmount = Math.min(Math.max(desiredInvestmentAmount, sliderMin), sliderMax)

	const closestGuideIndex = useMemo(() => {
		if (targetGuideItems.length === 0) {
			return -1
		}

		let closestIndex = 0
		let closestDistance = Math.abs(targetGuideItems[0].target - sliderAmount)

		for (let i = 1; i < targetGuideItems.length; i += 1) {
			const distance = Math.abs(targetGuideItems[i].target - sliderAmount)
			if (distance < closestDistance) {
				closestDistance = distance
				closestIndex = i
			}
		}

		return closestIndex
	}, [targetGuideItems, sliderAmount])

	useEffect(() => {
		if (retirementMethod !== 'target-amount') {
			setRetirementMethod('target-amount')
		}
	}, [retirementMethod, setRetirementMethod])

	const handleTargetAmountChange = (nextAmount: number) => {
		setRetirementMethod('target-amount')
		setDesiredInvestmentAmount(nextAmount)
	}

	return (
		<Card>
			<CardHeader className='flex flex-row items-start justify-between gap-2'>
				<div>
					<CardTitle>Retirement Need Estimate</CardTitle>
					<CardDescription>Estimate yearly retirement spending and financial freedom target from expenses.</CardDescription>
				</div>
				{toggleControl}
			</CardHeader>
			{!collapsed ? (
				<CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
					<div className='sm:col-span-2 space-y-4'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<div className='flex items-center justify-between gap-2'>
									<Label htmlFor='monthly-expenses'>Current Monthly Expenses</Label>
									<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={refreshMonthlyExpenses}
										disabled={!isSignedIn || isRefreshingExpenses}
									>
										{isRefreshingExpenses ? 'Refreshing...' : 'Refresh'}
									</Button>
								</div>
								<FormattedNumberInput
									id='monthly-expenses'
									value={monthlyExpenses}
									onValueChange={setMonthlyExpenses}
									maxFractionDigits={0}
								/>
							</div>
							<div className='rounded-md border p-3 text-sm text-muted-foreground space-y-1'>
								<p className='font-medium text-foreground'>Safe Withdrawal Rate</p>
								<p>{safeWithdrawalRate.toFixed(2)}%</p>
								<p>Set this in Preferences.</p>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='target-selection-slider'>Retirement Target Selection</Label>
							<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs'>
								{targetGuideItems.map((item, index) => (
									<button
										key={item.label}
										type='button'
										onClick={() => handleTargetAmountChange(item.target)}
										className={`rounded border px-2 py-1 text-left transition-colors ${
											closestGuideIndex === index ? 'border-accent text-accent font-semibold bg-accent/5' : 'border-border text-muted-foreground'
										}`}
									>
										<div>{item.label}</div>
										<div>{formatCurrency(item.target)}</div>
									</button>
								))}
							</div>
							<input
								id='target-selection-slider'
								type='range'
								min={sliderMin}
								max={sliderMax}
								step={1000}
								value={sliderAmount}
								onChange={(event) => handleTargetAmountChange(Number(event.target.value))}
								className='w-full'
							/>
							<div className='flex justify-between text-xs text-muted-foreground'>
								<span>{formatCurrency(sliderMin)}</span>
								<span>{formatCurrency(sliderMax)}</span>
							</div>
							<p className='text-sm text-muted-foreground'>Selected target amount: {formatCurrency(sliderAmount)}</p>
						</div>
						<div className='rounded-md border p-3 text-sm text-muted-foreground space-y-1'>
							<p>Current household income: {formatCurrency(financialMathSnapshot.grossIncome)} / year</p>
							<p>Income replacement rate: {incomeReplacementRate.toFixed(0)}%</p>
							<p>Annual income to replace: {formatCurrency(incomeReplacementAnnualNeed)} / year</p>
							<p>Income-replacement target: {formatCurrency(incomeReplacementTarget)}</p>
							<p className='text-xs opacity-70'>Projected income at retirement: {formatCurrency(projectedHouseholdIncomeAtRetirement)} / year</p>
						</div>
					</div>
					<div className='sm:col-span-2 rounded-md border p-3 text-xs text-muted-foreground space-y-1'>
						<p className='font-medium text-foreground'>Coast FIRE Check (Informational)</p>
						<p>Current portfolio: {formatCurrency(financialMathSnapshot.currentPortfolio)}</p>
						<p>Coast FIRE target needed today: {formatCurrency(coastFireTargetToday)}</p>
						<p className={hasReachedCoastFire ? 'text-accent font-semibold' : 'text-muted-foreground'}>
							{hasReachedCoastFire
								? `You are coast FIRE by ${formatCurrency(Math.abs(coastFireGap))}.`
								: `You need ${formatCurrency(Math.abs(coastFireGap))} more to reach coast FIRE.`}
						</p>
					</div>
					<div className='sm:col-span-2 rounded-md border p-3'>
						<p className='text-xs text-muted-foreground mb-2'>FIRE target numbers at current assumptions:</p>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
							{fireTargets.map((target, index) => (
								<div
									key={target.label}
									className={index === safeFireIndex ? 'font-semibold text-accent' : ''}
								>
									{target.label}: {formatCurrency(target.target)} ({formatCurrency(target.monthlySpendSupported)}/mo spend)
								</div>
							))}
						</div>
						<div className='mt-3 rounded-md border p-3 text-xs text-muted-foreground space-y-1'>
							<p>
								Suggested safe withdrawal for ~{retirementHorizonYears} retirement years: {suggestedSafeWithdrawalRate.toFixed(2)}%
							</p>
							<p>Financial freedom age (selected FIRE target): {financialFreedomAge !== null ? financialFreedomAge : 'Not reached by target age'}</p>
							<p>Current portfolio yearly income: {formatCurrency(financialMathSnapshot.yearlyPortfolioIncome)}</p>
							{selectedFireScenario ? (
								<>
									<p>
										{selectedFireScenario.label} percent to goal: {selectedFireScenario.percentToGoal.toFixed(2)}%
									</p>
									<p>
										Years to {selectedFireScenario.label} @ {financialMathSnapshot.yearsToGoalRatePercent}%:{' '}
										{selectedFireScenario.yearsUntilGoal === null ? 'Needs positive yearly savings to estimate' : selectedFireScenario.yearsUntilGoal.toFixed(2)}
									</p>
								</>
							) : null}
						</div>
						<div className='mt-3 border-t pt-3 text-xs text-muted-foreground space-y-1'>
							<p className='font-medium text-foreground'>How FIRE math is calculated</p>
							<p>Inflation rate comes from your Preferences modal: {inflationRate.toFixed(2)}%.</p>
							<p>
								1) {useInflationAdjustedValues ? 'Real-dollar annual spend' : 'Inflation-adjusted annual spend'} = ({formatCurrency(monthlyExpenses)} x 12)
								{!useInflationAdjustedValues ? ` x (1 + ${inflationRate.toFixed(2)}%)^${yearsToGoal}` : ''} = {formatCurrency(annualNeedAtRetirement)}
							</p>
							<p>
								2) Base FIRE target = {formatCurrency(annualNeedAtRetirement)} / ({safeWithdrawalRate.toFixed(2)}% / 100) = {formatCurrency(baseFinancialFreedomTarget)}
							</p>
							<p>
								3) {selectedFireLabel} target = {formatCurrency(baseFinancialFreedomTarget)} x {selectedFireMultiplier.toFixed(2)} = {formatCurrency(selectedFireTarget)}
							</p>
						</div>
					</div>
				</CardContent>
			) : null}
		</Card>
	)
}

