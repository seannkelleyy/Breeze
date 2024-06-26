import { IncomeItemsBox } from './income/IncomeItemsBox'
import { CategoryItemsBox } from './category/CategoryItemBox'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import { useState } from 'react'
import { useFetchBudget } from '@/services/hooks/budget/useFetchBudget'
import { BreezeModal } from '@/components/shared/BreezeModal'
import { Dayjs } from 'dayjs'

type EditBudgetModalProps = {
	date: Dayjs
	showModal: boolean
	setShowModal: (showModal: boolean) => void
}

export const EditBudgetModal = ({ date, showModal, setShowModal }: EditBudgetModalProps) => {
	const { data, status } = useFetchBudget({ date: date })
	const [monthlyIncome, setMonthlyIncome] = useState(0)
	const [monthlyExpenses, setMonthlyExpenses] = useState(0)

	return (
		<BreezeModal
			title='Edit Budget'
			showModal={showModal}
			onClose={() => setShowModal(!showModal)}
		>
			<div style={{ overflow: 'auto', maxHeight: '70vh' }}>
				{' '}
				<BreezeText
					type='large-heading'
					text='Edit Budget'
				/>
				<BreezeCard
					title='Budget Headlines'
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
				<BreezeBox
					title='Budget Items'
					style={{
						width: '85%',
					}}
				>
					{data ? (
						<>
							<IncomeItemsBox setIncome={setMonthlyIncome} />
							<CategoryItemsBox setExpenses={setMonthlyExpenses} />
						</>
					) : status === 'loading' ? (
						<BreezeText
							type='large'
							text='Loading...'
						/>
					) : (
						<BreezeText
							type='large'
							text='Error loading budget'
						/>
					)}
				</BreezeBox>
			</div>{' '}
			{/* End of added div */}
		</BreezeModal>
	)
}
