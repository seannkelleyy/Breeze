import { GoalItemsBox } from './features/goals/GoalItemsBox'
import { BudgetSection } from './budgetSection/BudgetSection'
import { Progress } from './features/Progress'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { BreezeButton } from '../../components/shared/BreezeButton'
import { AddExpenseModal } from '../addExpense/AddExpense'
import { AddIncomeModal } from '../addIncome/AddIncome'
import { ProfileModal } from '@/components/auth/ProfileModal'
import dayjs from 'dayjs'

/**
 * This is the home page component that calls the components that make up the home page.
 * This is where the user lands after signing in.
 */
export const HomePage = () => {
	const { user } = useAuth0()
	const [showProfileModal, setShowProfileModal] = useState(false)
	const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
	const [showAddIncomeModal, setShowAddIncomeModal] = useState(false)

	return (
		<>
			<BreezeBox
				title='Overview'
				style={{
					textAlign: 'center',
					paddingBottom: '3rem',
				}}
			>
				<BreezeButton
					content={
						<img
							src={user?.picture}
							alt='Profile picture'
							style={{
								width: '3rem',
								height: '3rem',
								borderRadius: '3rem',
							}}
						/>
					}
					onClick={() => setShowProfileModal(!showProfileModal)}
					style={{
						position: 'absolute',
						top: '1rem',
						right: '1rem',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: '3rem',
						height: '3rem',
						borderRadius: '3rem',
					}}
				/>
				{showProfileModal && (
					<ProfileModal
						showModal={showProfileModal}
						setShowModal={setShowProfileModal}
					/>
				)}
				<BreezeText
					text={<u>BREEZE</u>}
					type='title'
				/>
				<BreezeCard title='Date'>
					<BreezeText
						text={dayjs().format('MMMM DD, YYYY')}
						type='small-heading'
					/>
				</BreezeCard>
				<Progress />
				<GoalItemsBox />
				<AddExpenseModal
					showModal={showAddExpenseModal}
					setShowModal={setShowAddExpenseModal}
				/>
				<AddIncomeModal
					showModal={showAddIncomeModal}
					setShowModal={setShowAddIncomeModal}
				/>
				<BreezeBox title='Add Buttons'>
					<BreezeButton
						content='Add New Expense'
						size='large'
						onClick={() => {
							setShowAddExpenseModal(!showAddExpenseModal)
						}}
					/>
					<BreezeButton
						content='Add New Income'
						size='large'
						onClick={() => {
							setShowAddIncomeModal(!showAddIncomeModal)
						}}
					/>
				</BreezeBox>
			</BreezeBox>
			<BudgetSection />
		</>
	)
}
