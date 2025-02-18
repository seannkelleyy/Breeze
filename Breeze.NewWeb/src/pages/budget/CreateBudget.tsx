import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useState } from 'react'
import { Budget } from '../../services/hooks/budget/budgetServices'
import { useMsal } from '@azure/msal-react'

export const CreateBudget = () => {
	const account = useMsal().accounts[0]
	const [newBudget, setNewBudget] = useState<Budget>({
		id: -1,
		userId: account.homeAccountId,
		monthlyIncome: 0,
		monthlyExpenses: 0,
		date: new Date().getUTCDate().toString(),
	})
	const [incomeList, setIncomeList] = useState<Incomes[]>([])

	return (
		<Card className='flex flex-col justify-center items-center p-4'>
			<h1 className='text-2xl font-bold'>Create Budget</h1>
			<Link to='/'>
				<Button className='mt-4'>Back</Button>
			</Link>
			<h2>Amount to allocate: ${(newBudget.monthlyIncome - newBudget.monthlyExpenses).toFixed(2)}</h2>
			<h1>Income</h1>
			<Button 
		</Card>
	)
}

