import { type ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RequiredMonthlyContributionCardProps {
	collapsed: boolean
	toggleControl: ReactNode
	monthlyNeededForDesiredTarget: number
	requiredMonthlyTargetLabel: string
	annualHouseholdIncome: number
	weightedAnnualRate: number
	yearsToGoal: number
	currentSavingsRateEmployeePercent: number
	currentSavingsRateTotalPercent: number
	requiredSavingsRatePercent: number
	savingsRateGapPercent: number
	monthlyGapToGoal: number
	isMonthlyGapPositive: boolean
	formatCurrency: (value: number) => string
}

const RequiredMonthlyContributionCard = ({
	collapsed,
	toggleControl,
	monthlyNeededForDesiredTarget,
	requiredMonthlyTargetLabel,
	annualHouseholdIncome,
	weightedAnnualRate,
	yearsToGoal,
	currentSavingsRateEmployeePercent,
	currentSavingsRateTotalPercent,
	requiredSavingsRatePercent,
	savingsRateGapPercent,
	monthlyGapToGoal,
	isMonthlyGapPositive,
	formatCurrency,
}: RequiredMonthlyContributionCardProps) => {
	return (
		<Card>
			<CardHeader className='flex flex-row items-start justify-between gap-2'>
				<div>
					<CardTitle>Required Monthly Contribution</CardTitle>
					<CardDescription>Monthly amount needed to hit your target by retirement age.</CardDescription>
				</div>
				{toggleControl}
			</CardHeader>
			{!collapsed ? (
				<CardContent>
					<p className='text-3xl font-bold text-success'>{formatCurrency(monthlyNeededForDesiredTarget)}</p>
					<p className='text-sm text-muted-foreground mt-2'>Based on: {requiredMonthlyTargetLabel}</p>
					<p className='text-sm text-muted-foreground mt-1'>Annual household income: {formatCurrency(annualHouseholdIncome)}</p>
					<p className='text-sm text-muted-foreground mt-2'>
						Using weighted annual return of {weightedAnnualRate.toFixed(2)}% over {yearsToGoal} years.
					</p>
					<p className='text-sm text-muted-foreground mt-1'>Current employee savings rate: {currentSavingsRateEmployeePercent.toFixed(1)}%</p>
					<p className='text-sm text-muted-foreground mt-1'>Current total savings rate (employee + match): {currentSavingsRateTotalPercent.toFixed(1)}%</p>
					<p className='text-sm text-muted-foreground mt-1'>Required savings rate: {requiredSavingsRatePercent.toFixed(1)}%</p>
					<p className={savingsRateGapPercent >= 0 ? 'text-sm text-success mt-1' : 'text-sm text-destructive mt-1'}>
						Savings rate gap: {savingsRateGapPercent >= 0 ? '+' : ''}
						{savingsRateGapPercent.toFixed(1)}%
					</p>
					<p className={isMonthlyGapPositive ? 'text-sm text-success mt-1' : 'text-sm text-destructive mt-1'}>
						Planned total is {formatCurrency(Math.abs(monthlyGapToGoal))}/month {isMonthlyGapPositive ? 'above' : 'below'} required.
					</p>
				</CardContent>
			) : null}
		</Card>
	)
}

export default RequiredMonthlyContributionCard

