import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeText } from '../../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeSelect } from '../../../components/shared/BreezeSelect'
import { Expense } from '../../../services/hooks/expense/expenseServices'
import { usePostExpense } from '@/services/hooks/expense/usePostExpense'
import { BreezeModal } from '@/components/shared/BreezeModal'
import dayjs from 'dayjs'
import { useFetchExpenses } from '@/services/hooks/expense/useFetchExpenses'
import { LoadingEffect } from '@/components/shared/LoadingEffect'
import { Controller, useForm } from 'react-hook-form'

type AddExpenseProps = {
	setShowModal: (showModal: boolean | ((prevShowModal: boolean) => boolean)) => void
}

type FormInputs = {
	name: string
	amount: number
	date: string
	categoryName: string
}

export const AddExpenseModal = ({ setShowModal }: AddExpenseProps) => {
	const { user } = useAuth0()
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()

	const {
		handleSubmit,
		getValues,
		control,
		formState: { isValid },
	} = useForm<FormInputs>({
		defaultValues: {
			name: '',
			amount: 0,
			date: dayjs().format('YYYY-MM-DD'),
			categoryName: categories[0]?.name ?? -1,
		},
		mode: 'onChange',
	})

	const { refetch: refetchExpenses } = useFetchExpenses({ category: categories.find((category) => category.name === getValues().categoryName) ?? categories[0] })

	const postMutation = usePostExpense({
		onSettled: () => {
			refetchCategories()
			refetchBudget()
			refetchExpenses()
		},
	})
	const onSubmit = (data: FormInputs) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const category = categories.find((category) => category.name === data.categoryName)!
		const expense: Expense = {
			userId: user?.email ?? '',
			categoryId: category?.id ?? -1,
			name: data.name,
			amount: data.amount,
			date: data.date,
		}
		postMutation.mutate({ category, expense })
		setShowModal((prev) => !prev)
	}

	if (!categories) return <LoadingEffect />

	return (
		<BreezeModal
			title='Add Expense'
			style={{
				maxHeight: '110%',
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
					text='Add Expense'
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
							title='Expense Name'
							placeholder='name'
							label='Expense Name:'
							style={{ width: '100%' }}
						/>
					)}
				/>
				<Controller
					name='categoryName'
					control={control}
					defaultValue={categories[0]?.name ?? ''}
					rules={{ required: true }}
					render={({ field }) => (
						<BreezeSelect
							{...field}
							title='Category Select'
							label='Expense Category:'
							options={categories.map((category) => category.name)}
							style={{ width: '100%' }}
						/>
					)}
				/>
				<Controller
					name='amount'
					control={control}
					defaultValue={0}
					rules={{ required: true, min: 0.01 }}
					render={({ field }) => (
						<BreezeInput
							{...field}
							type='number'
							title='Expense Amount'
							placeholder='amount'
							label='Expense Amount:'
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
							title='Expense Date'
							placeholder='date'
							label='Expense Date:'
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
