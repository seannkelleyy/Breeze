import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FinancialMathSnapshot } from '../../types/finance'

interface ExpensesEmergencyFundCardProps {
	snapshot: FinancialMathSnapshot
	formatCurrency: (value: number) => string
}

const ExpensesEmergencyFundCard = ({ snapshot, formatCurrency }: ExpensesEmergencyFundCardProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Expenses + Emergency Fund</CardTitle>
			</CardHeader>
			<CardContent className='space-y-1 text-sm'>
				<p>Monthly expenses: {formatCurrency(snapshot.monthlyExpenses)}</p>
				<p>3 months: {formatCurrency(snapshot.emergencyFund3Months)}</p>
				<p>6 months: {formatCurrency(snapshot.emergencyFund6Months)}</p>
				<p>12 months: {formatCurrency(snapshot.emergencyFund12Months)}</p>
			</CardContent>
		</Card>
	)
}

export default ExpensesEmergencyFundCard

