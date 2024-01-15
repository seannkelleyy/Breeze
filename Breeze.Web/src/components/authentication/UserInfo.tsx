import { useAuth0 } from '@auth0/auth0-react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeText } from '../shared/BreezeText'

const Profile = () => {
	const { user, isAuthenticated, isLoading } = useAuth0()

	if (isLoading) {
		return <BreezeBox title='Loading'>Loading ...</BreezeBox>
	}

	return (
		isAuthenticated && (
			<BreezeBox title='Profile'>
				<img
					src={user?.picture}
					alt={user?.name}
				/>
				<BreezeText
					text={user?.name}
					type='medium'
				/>
				<BreezeText
					text={user?.email}
					type='small'
				/>
			</BreezeBox>
		)
	)
}

export default Profile
