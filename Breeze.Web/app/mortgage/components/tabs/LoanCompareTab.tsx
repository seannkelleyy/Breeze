import { TabsContent } from '@/components/ui/tabs'

interface HomeLoanContext {
	accountName: string
	currentBalance: number
	originalLoanAmount?: number
	interestRate: number
}

interface CompareTermRow {
	termYears: number
	monthlyPayment: number
	totalInterest: number
	monthsToPayoff: number
	payoffDate: Date | null
}

interface LoanCompareTabProps {
	homeLoan: HomeLoanContext | null
	loanPaidDownPercent: number | null
	compareTerms: CompareTermRow[]
	formatCurrency: (value: number) => string
}

const monthDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

const LoanCompareTab = ({ homeLoan, loanPaidDownPercent, compareTerms, formatCurrency }: LoanCompareTabProps) => {
	return (
		<TabsContent
			value='loan-compare'
			className='space-y-3'
		>
			{homeLoan ? (
				<>
					<p className='text-sm text-muted-foreground'>
						{homeLoan.accountName} balance {formatCurrency(homeLoan.currentBalance)} at {homeLoan.interestRate.toFixed(2)}%
					</p>
					{homeLoan.originalLoanAmount && homeLoan.originalLoanAmount > 0 ? (
						<p className='text-sm text-muted-foreground'>
							Original loan: {formatCurrency(homeLoan.originalLoanAmount)}
							{loanPaidDownPercent !== null ? `, Paid down: ${loanPaidDownPercent.toFixed(1)}%` : ''}
						</p>
					) : null}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
						{compareTerms.map((scenario) => (
							<div
								key={scenario.termYears}
								className='rounded-md border p-3 space-y-1 text-sm'
							>
								<p className='font-medium'>{scenario.termYears}-Year</p>
								<p>Payment: {formatCurrency(scenario.monthlyPayment)}/mo</p>
								<p>Total interest: {formatCurrency(scenario.totalInterest)}</p>
								<p>Payoff: {scenario.payoffDate ? monthDateFormatter.format(scenario.payoffDate) : 'N/A'}</p>
								<p>Months: {scenario.monthsToPayoff}</p>
							</div>
						))}
					</div>
				</>
			) : null}
		</TabsContent>
	)
}

export default LoanCompareTab
