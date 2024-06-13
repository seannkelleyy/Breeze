import { AddButtons } from './AddButtons'
import { Goals } from './features/Goals'
import { BudgetSection } from './budgetSection/BudgetSection'
import { Progress } from './features/Progress'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import { useAuth0 } from '@auth0/auth0-react'
import { LogoutModal } from '../../components/auth/LogoutModal'
import { useState } from 'react'
import { BreezeButton } from '../../components/shared/BreezeButton'
import { useDateContext } from '../../services/providers/DateProvider'

/**
 * This is the home page component that calls the components that make up the home page.
 * This is where the user lands after signing in.
 */
export const HomePage = () => {
	const { user } = useAuth0()
	const [showModal, setShowModal] = useState(false)
	const { date, getMonthAsString } = useDateContext()

	return (
		<BreezeBox title='Home Page'>
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
					onClick={() => setShowModal(!showModal)}
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
				{showModal && (
					<LogoutModal
						showModal={showModal}
						setShowModal={setShowModal}
					/>
				)}
				<BreezeText
					text={<u>BREEZE</u>}
					type='title'
				/>
				<BreezeCard title='Date'>
					<BreezeText
						text={`${date.getDate() + ' '}
					${getMonthAsString(date.getMonth()) + ' '}
					${date.getFullYear()}`}
						type='small-heading'
					/>
				</BreezeCard>
				<Progress />
				<Goals />
				<AddButtons />
			</BreezeBox>
			<BudgetSection />
		</BreezeBox>
	)
}
