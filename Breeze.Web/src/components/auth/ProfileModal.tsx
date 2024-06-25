import { BreezeText } from '../shared/BreezeText'
import LogoutButton from './Logout'
import { useEnvironmentVariables } from '@/config/environment/useEnvironmentVariables'
import { useAuth0 } from '@auth0/auth0-react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeModal } from '../shared/BreezeModal'

type LogoutModalProps = {
	showModal: boolean
	setShowModal: (showModal: boolean) => void
}

/**
 * A modal that shows when the user clicks the logout button.
 * @param props.showModal: A boolean that determines if the modal is shown.
 * @param props.setShowModal: A function that sets the showModal state.
 
 */
export const ProfileModal = ({ showModal, setShowModal }: LogoutModalProps) => {
	const { appVersion } = useEnvironmentVariables()
	const { user, isLoading } = useAuth0()

	return (
		<BreezeModal
			title='Profile'
			showModal={showModal}
			isLoading={isLoading}
			onClose={() => setShowModal(!showModal)}
		>
			<BreezeBox
				title='Profile'
				style={{
					marginTop: '5rem',
					gap: '1rem',
				}}
			>
				<BreezeText
					text='Profile'
					type='large-heading'
					style={{
						position: 'relative',
						top: '-1.5rem',
					}}
				/>
				<img
					src={user?.picture}
					alt={user?.name}
					style={{
						borderRadius: '50%',
					}}
				/>
				<BreezeText
					text={`Name: ${user?.name}`}
					type='medium'
				/>
				<BreezeText
					text={`Email: ${user?.email}`}
					type='small'
				/>
				<BreezeText
					text={`Phone: ${user?.phone_number || 'N/A'}`}
					type='small'
				/>
				<BreezeText
					text={`User Id: ${user?.sub}`}
					type='small'
				/>
			</BreezeBox>
			<LogoutButton />
			<BreezeText
				text={`Breeze Version: ${appVersion}`}
				type='small'
				style={{
					fontSize: '0.8rem',
				}}
			/>
		</BreezeModal>
	)
}
