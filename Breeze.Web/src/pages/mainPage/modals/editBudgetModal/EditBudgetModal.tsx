import { IncomeItemsBox } from './income/IncomeItemsBox'
import { CategoryItemsBox } from './category/CategoryItemBox'
import { BreezeBox } from '../../../../components/shared/BreezeBox'
import { BreezeText } from '../../../../components/shared/BreezeText'
import { BreezeCard } from '../../../../components/shared/BreezeCard'
import { useState } from 'react'
import { useFetchBudget } from '@/services/hooks/budget/useFetchBudget'
import { BreezeModal } from '@/components/shared/BreezeModal'
import { Dayjs } from 'dayjs'
import { LoadingEffect } from '@/components/shared/LoadingEffect'

type EditBudgetModalProps = {
	date: Dayjs
	setShowModal: (showModal: boolean | ((prevShowModal: boolean) => boolean)) => void
}

export const EditBudgetModal = ({ date, setShowModal }: EditBudgetModalProps) => {
	const { data, status } = useFetchBudget({ date: date })
	const [monthlyIncome, setMonthlyIncome] = useState(0)
	const [monthlyExpenses, setMonthlyExpenses] = useState(0)

	if (status === 'loading')
		return (
			<BreezeModal
				title='Edit Budget'
				onClose={() => setShowModal((prev) => !prev)}
			>
				<LoadingEffect />
			</BreezeModal>
		)

	if (status === 'error')
		return (
			<BreezeModal
				title='Edit Budget'
				onClose={() => setShowModal((prev) => !prev)}
			>
				<BreezeText
					type='large'
					text='Error loading budget'
				/>
			</BreezeModal>
		)
	return (
		<BreezeModal
			title='Edit Budget'
			onClose={() => setShowModal((prev) => !prev)}
		>
			<div style={{ overflow: 'auto', maxHeight: '100%' }}>
				<BreezeText
					type='large-heading'
					text='Edit Budget'
				/>
				<BreezeCard
					title='Budget Headlines'
					secondary
					style={{
						position: 'sticky',
						top: 0,
						gap: '.15em',
						padding: '.6em',
						minWidth: '60%',
					}}
				>
					<BreezeText
						type='large'
						text={date.format('MMMM YYYY')}
					/>
					<BreezeText
						type='large'
						text={`Income: $${monthlyIncome}`}
					/>
					<BreezeText
						type='large'
						text={`Expenses: $${monthlyExpenses}`}
					/>
					<section className={monthlyIncome - monthlyExpenses >= 0 ? 'amount-left-positive' : 'amount-left-negative'}>
						<BreezeText
							type='large'
							style={{
								padding: '.25em',
							}}
							text={`Remaining: $${monthlyExpenses ? monthlyIncome - monthlyExpenses : 0}`}
						/>
					</section>
				</BreezeCard>
				<BreezeBox title='Budget Items'>
					{data && (
						<>
							<IncomeItemsBox setIncome={setMonthlyIncome} />
							<CategoryItemsBox setExpenses={setMonthlyExpenses} />
						</>
					)}
				</BreezeBox>
			</div>
		</BreezeModal>
	)
}
