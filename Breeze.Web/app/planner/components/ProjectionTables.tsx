import type { ReactNode } from 'react'

import { formatCurrencyWithCode } from '../lib/plannerMath'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'

type ProjectionRow = {
	age: number
	totalBalance: number
	totalContributions: number
	[key: `account-${number}`]: number
}

type AccountBreakdownRow = {
	id: string
	name: string
	ownerLabel: string
	accountTypeLabel: string
	employeeMonthly: number
	matchMonthly: number
	totalMonthly: number
	annualEmployee: number
	suggestedLimit: number
	exceedsLimit: boolean
	projectedValue: number
}

export type ProjectionTablesContextValue = {
	data: {
		projectionRows: ProjectionRow[]
		accountBreakdownRows: AccountBreakdownRow[]
	}
}

export type ProjectionTablesProps = ProjectionTablesContextValue & {
	sections: {
		yearlyCollapsed: boolean
		yearlyToggleControl: ReactNode
		accountBreakdownCollapsed: boolean
		accountBreakdownToggleControl: ReactNode
	}
}

const ProjectionTables = ({ sections, data }: ProjectionTablesProps) => {
	const { currencyCode, plannerSummary } = useCurrentUser()
	const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode)
	const { yearlyCollapsed, yearlyToggleControl, accountBreakdownCollapsed, accountBreakdownToggleControl } = sections
	const { projectionRows, accountBreakdownRows } = data
	const targetAge = plannerSummary?.targetAge ?? 0

	return (
		<div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
			<Card>
				<CardHeader className='flex flex-row items-start justify-between gap-2'>
					<div>
						<CardTitle>Year-by-Year Projection</CardTitle>
						<CardDescription>Projected growth and contribution totals by age.</CardDescription>
					</div>
					{yearlyToggleControl}
				</CardHeader>
				{!yearlyCollapsed ? (
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Age</TableHead>
									<TableHead>Portfolio Value</TableHead>
									<TableHead>Total Contributions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{projectionRows.map((row) => (
									<TableRow key={row.age}>
										<TableCell>{row.age}</TableCell>
										<TableCell>{formatCurrency(row.totalBalance)}</TableCell>
										<TableCell>{formatCurrency(row.totalContributions)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				) : null}
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-start justify-between gap-2'>
					<div>
						<CardTitle>Account Contribution Breakdown</CardTitle>
						<CardDescription>Per-account monthly amounts, limits, and projected values at target age.</CardDescription>
					</div>
					{accountBreakdownToggleControl}
				</CardHeader>
				{!accountBreakdownCollapsed ? (
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Account</TableHead>
									<TableHead>Owner</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Employee / Month</TableHead>
									<TableHead>Match / Month</TableHead>
									<TableHead>Total / Month</TableHead>
									<TableHead>Annual vs Limit</TableHead>
									<TableHead>Projected Value at {targetAge}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{accountBreakdownRows.map((row) => {
									return (
										<TableRow key={row.id}>
											<TableCell>{row.name}</TableCell>
											<TableCell>{row.ownerLabel}</TableCell>
											<TableCell>{row.accountTypeLabel}</TableCell>
											<TableCell>{formatCurrency(row.employeeMonthly)}</TableCell>
											<TableCell>{formatCurrency(row.matchMonthly)}</TableCell>
											<TableCell>{formatCurrency(row.totalMonthly)}</TableCell>
											<TableCell className={row.exceedsLimit ? 'text-destructive font-medium' : ''}>
												{row.suggestedLimit > 0 ? `${formatCurrency(row.annualEmployee)} / ${formatCurrency(row.suggestedLimit)}` : 'N/A'}
											</TableCell>
											<TableCell>{formatCurrency(row.projectedValue)}</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</CardContent>
				) : null}
			</Card>
		</div>
	)
}

export default ProjectionTables

