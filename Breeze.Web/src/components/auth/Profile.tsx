import { useAuth0 } from '@auth0/auth0-react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeText } from '../shared/BreezeText'
import { BreezeCard } from '../shared/BreezeCard'
import { BackButton } from '../shared/BackButton'
import { useEnvironmentVariables } from '../../config/environment/useEnvironmentVariables'

export const Profile = () => {
	const { appVersion } = useEnvironmentVariables()
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
				<BackButton />
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
						text={`Breeze Version: ${appVersion}`}
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
