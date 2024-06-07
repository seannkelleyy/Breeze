import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect, useState } from 'react'
import { Income, useIncomes } from '../../../services/hooks/IncomeServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/contexts/BudgetContext'
import { useMutation } from 'react-query'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
	setIncome: (amount: number) => void
}

export const IncomeItemsBox = ({ incomeItems, setIncome }: IncomeItemsBoxProps) => {
	const { postIncome } = useIncomes()
	const postMutation = useMutation(postIncome, {
		onSuccess: (id, variables) => {
			variables.id = id
			setItems((prevItems) => [...prevItems, variables])
		},
	})
	const { user } = useAuth0()
	const { budget } = useBudgetContext()
	const [items, setItems] = useState<Income[]>(incomeItems ?? [])

	useEffect(() => {
		setIncome(items.reduce((acc, item) => acc + 1 * item.amount, 0))
	}, [items, setIncome])

	const addIncome = () => {
		const newIncome: Income = {
			userId: user?.email ?? '',
			budgetId: budget.id,
			name: '',
			amount: 0,
			year: new Date(Date.now()).getFullYear(),
			month: new Date(Date.now()).getMonth() + 1,
			day: new Date(Date.now()).getDate(),
		}
		postMutation.mutate(newIncome)
	}

	const onUpdate = (income: Income) => {
		const newItems = items.map((item) => {
			if (item.id === income.id) {
				return income
			}
			return item
		})
		setItems(newItems)
	}

	const handleDelete = (deletedIncome: Income) => {
		setItems(items.filter((income) => income.id !== deletedIncome.id))
	}

	return (
		<BreezeBox
			title='incomes'
			style={{
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Incomes'
			/>
			{items &&
				items.map((income) => (
					<IncomeItem
						key={income.id}
						incomeItem={income}
						onUpdate={onUpdate}
						onDelete={handleDelete}
					/>
				))}

			<BreezeButton
				content='Add Income'
				onClick={addIncome}
			/>
		</BreezeBox>
	)
}
