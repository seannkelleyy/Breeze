import { useAuth0 } from '@auth0/auth0-react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeText } from '../shared/BreezeText'
import { BreezeCard } from '../shared/BreezeCard'
import { APP_VERSION } from '../../services/environment'

const Profile = () => {
	const { user, isAuthenticated, isLoading } = useAuth0()

	if (isLoading) {
		return <BreezeBox title='Loading'>Loading ...</BreezeBox>
	}

	return (
		isAuthenticated && (
			<BreezeBox
				title='Profile'
				style={{
					marginTop: '5rem',
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
				<BreezeCard
					title='Profile'
					style={{
						padding: '2rem',
						gap: '1.5rem',
					}}
				>
					<img
						src={user?.picture}
						alt={user?.name}
						style={{
							borderRadius: '50%',
						}}
					/>
					<BreezeText
						text={user?.name}
						type='medium'
					/>
					<BreezeText
						text={user?.email}
						type='small'
					/>
					<BreezeText
						text={`Breeze Version: ${APP_VERSION}`}
						type='small'
						style={{
							fontSize: '0.8rem',
						}}
					/>
				</BreezeCard>
			</BreezeBox>
		)
	)
}

export default Profile
