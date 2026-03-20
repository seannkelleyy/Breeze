import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'

interface HomeLoanContext {
	accountName: string
}

interface LoanSummary {
	monthsToPayoff: number
}

interface RefinanceSummary {
	refinancePrincipal: number
	refinancePayment: number
	monthlySavings: number
	interestSavings: number
	breakEvenMonths: number | null
	nominalCashFlowDelta: number
	npv: number
	recommendationLabel: string
	recommendationScore: number
	recommendationReasons: string[]
}

interface RefinanceTabProps {
	data: {
		homeLoan: HomeLoanContext | null
		baseLoanSummary: LoanSummary | null
		refinanceSummary: RefinanceSummary | null
	}
	state: {
		refiRate: number
		refiTermYears: number
		refiClosingCosts: number
		refiCashOut: number
		refiDiscountRate: number
	}
	actions: {
		setRefiRate: (value: number) => void
		setRefiTermYears: (value: number) => void
		setRefiClosingCosts: (value: number) => void
		setRefiCashOut: (value: number) => void
		setRefiDiscountRate: (value: number) => void
	}
	helpers: {
		formatCurrency: (value: number) => string
	}
}

const RefinanceTab = ({ data, state, actions, helpers }: RefinanceTabProps) => {
	const { homeLoan, baseLoanSummary, refinanceSummary } = data
	const { refiRate, refiTermYears, refiClosingCosts, refiCashOut, refiDiscountRate } = state
	const { setRefiRate, setRefiTermYears, setRefiClosingCosts, setRefiCashOut, setRefiDiscountRate } = actions
	const { formatCurrency } = helpers

	return (
		<TabsContent
			value='refinance'
			className='space-y-3'
		>
			{homeLoan && baseLoanSummary && refinanceSummary ? (
				<>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
						<div className='space-y-1'>
							<Label>New Rate %</Label>
							<FormattedNumberInput
								value={refiRate}
								onValueChange={setRefiRate}
								maxFractionDigits={3}
							/>
						</div>
						<div className='space-y-1'>
							<Label>New Term (years)</Label>
							<FormattedNumberInput
								value={refiTermYears}
								onValueChange={setRefiTermYears}
								maxFractionDigits={0}
							/>
						</div>
						<div className='space-y-1'>
							<Label>Closing Costs</Label>
							<FormattedNumberInput
								value={refiClosingCosts}
								onValueChange={setRefiClosingCosts}
								maxFractionDigits={0}
							/>
						</div>
						<div className='space-y-1'>
							<Label>Cash Out</Label>
							<FormattedNumberInput
								value={refiCashOut}
								onValueChange={setRefiCashOut}
								maxFractionDigits={0}
							/>
						</div>
						<div className='space-y-1'>
							<Label>Alt Return / Discount %</Label>
							<FormattedNumberInput
								value={refiDiscountRate}
								onValueChange={setRefiDiscountRate}
								maxFractionDigits={2}
							/>
						</div>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm'>
						<p>New principal: {formatCurrency(refinanceSummary.refinancePrincipal)}</p>
						<p>New payment: {formatCurrency(refinanceSummary.refinancePayment)}/mo</p>
						<p>Monthly savings: {formatCurrency(refinanceSummary.monthlySavings)}</p>
						<p>Interest saved: {formatCurrency(refinanceSummary.interestSavings)}</p>
						<p>Break-even: {refinanceSummary.breakEvenMonths !== null ? `${refinanceSummary.breakEvenMonths} months` : 'No break-even'}</p>
						<p>Nominal cash-flow delta: {formatCurrency(refinanceSummary.nominalCashFlowDelta)}</p>
						<p>Discounted NPV: {formatCurrency(refinanceSummary.npv)}</p>
					</div>
					<div className='rounded-md border p-3 text-sm space-y-1'>
						<p className='font-medium'>
							Recommendation: {refinanceSummary.recommendationLabel} (score {refinanceSummary.recommendationScore})
						</p>
						{refinanceSummary.recommendationReasons.map((reason) => (
							<p
								key={reason}
								className='text-muted-foreground'
							>
								- {reason}
							</p>
						))}
					</div>
				</>
			) : null}
		</TabsContent>
	)
}

export default RefinanceTab

