import { Link } from 'react-router-dom'
import { BreezeText } from '../shared/BreezeText'
import { BreezeCard } from '../shared/BreezeCard'
import { BreezeButton } from '../shared/BreezeButton'
import LogoutButton from './Logout'

type LogoutModalProps = {
	showModal: boolean
	setShowModal: (showModal: boolean) => void
}

/**
 * A modal that shows when the user clicks the logout button.
 * @param props.showModal: A boolean that determines if the modal is shown.
 * @param props.setShowModal: A function that sets the showModal state.
 
 */
export const LogoutModal = ({ showModal, setShowModal }: LogoutModalProps) => {
	return (
		<BreezeCard
			title='Logout Modal'
			style={{
				position: 'absolute',
				top: '1rem',
				right: '1rem',
				borderRadius: '1rem',
				minWidth: '9em',
				minHeight: '9em',
			}}
		>
			<BreezeButton
				content={
					<img
						className='svg-icon'
						src='./close.svg'
						alt='Close'
						style={{
							width: '2rem',
							height: '2rem',
						}}
					/>
				}
				onClick={() => setShowModal(!showModal)}
				style={{
					position: 'absolute',
					top: '0',
					right: '-.75rem',
					borderRadius: '1rem',
					background: 'none',
					boxShadow: 'none',
				}}
			/>
			<Link to='/profile'>
				<BreezeText
					text='Profile'
					type='large'
					style={{
						marginTop: '1rem',
					}}
				/>
			</Link>
			<LogoutButton />
		</BreezeCard>
	)
}
