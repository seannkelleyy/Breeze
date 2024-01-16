import { Link } from 'react-router-dom'
import { BreezeText } from '../shared/BreezeText'
import { BreezeCard } from '../shared/BreezeCard'
import LoginButton from './Login'

export const LogoutModal = () => {
	return (
		<BreezeCard
			title='Logout Modal'
			style={{
				position: 'absolute',
				top: '1rem',
				right: '1rem',
				borderRadius: '1rem',
				width: '15rem',
				height: '10rem',
			}}
		>
			<Link to='/Breeze/Profile'>
				<BreezeText
					text='Profile'
					type='medium'
				/>
			</Link>
			<LoginButton />
		</BreezeCard>
	)
}
