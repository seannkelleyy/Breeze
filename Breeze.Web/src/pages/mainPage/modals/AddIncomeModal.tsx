import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeText } from '../../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { usePostIncome } from '@/services/hooks/income/usePostIncome'
import { Income } from '@/services/hooks/income/incomeServices'
import { BreezeModal } from '@/components/shared/BreezeModal'
import dayjs from 'dayjs'
import { LoadingEffect } from '@/components/shared/LoadingEffect'
import { Controller, useForm } from 'react-hook-form'

type AddIncomeModalProps = {
	setShowModal: (showModal: boolean | ((prevShowModal: boolean) => boolean)) => void
}

type FormInputs = {
	name: string
	amount: number
	date: string
}

export const AddIncomeModal = ({ setShowModal }: AddIncomeModalProps) => {
	const { user } = useAuth0()
	const { budget, refetchIncomes, refetchBudget } = useBudgetContext()

	const {
		handleSubmit,
		control,
		formState: { isValid },
	} = useForm<FormInputs>({
		defaultValues: {
			name: '',
			amount: 0,
			date: dayjs().format('YYYY-MM-DD'),
		},
		mode: 'onChange',
	})

	const postMutation = usePostIncome({
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
		},
	})

	const onSubmit = (data: FormInputs) => {
		const income: Income = {
			userId: user?.email ?? '',
			budgetId: budget.id,
			name: data.name,
			amount: data.amount,
			date: data.date,
		}
		postMutation.mutate({ income })
		setShowModal((prev) => !prev)
	}

	if (!budget) return <LoadingEffect />

	return (
		<BreezeModal
			title='Add Expense'
			style={{
				maxHeight: '100%',
				overflow: 'auto',
				justifyContent: 'space-evenly',
			}}
			onClose={() => setShowModal((prev) => !prev)}
		>
			<form
				onSubmit={handleSubmit(onSubmit)}
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minWidth: '75%',
					gap: '1rem',
				}}
			>
				<BreezeText
					type='large-heading'
					text='Add Income'
					style={{
						alignSelf: 'self-start',
					}}
				/>
				<Controller
					name='name'
					control={control}
					defaultValue=''
					rules={{ required: true }}
					render={({ field }) => (
						<BreezeInput
							{...field}
							type='text'
							title='Income Name'
							placeholder='name'
							label='Income Name:'
							style={{ width: '100%' }}
						/>
					)}
				/>
				<Controller
					name='amount'
					control={control}
					defaultValue={0}
					rules={{ required: true }}
					render={({ field }) => (
						<BreezeInput
							{...field}
							type='number'
							title='Income Amount'
							placeholder='amount'
							label='Income Amount:'
							style={{ width: '100%' }}
						/>
					)}
				/>
				<Controller
					name='date'
					control={control}
					defaultValue={dayjs().format('YYYY-MM-DD')}
					rules={{ required: true }}
					render={({ field }) => (
						<BreezeInput
							{...field}
							type='date'
							title='Income Date'
							placeholder='date'
							label='Income Date:'
							style={{ width: '100%' }}
						/>
					)}
				/>
				{isValid ? (
					<BreezeButton
						type='submit'
						content='Add Expense'
					/>
				) : (
					<BreezeText
						type='small'
						text='Please fill out all fields '
					/>
				)}
			</form>
		</BreezeModal>
	)
}
