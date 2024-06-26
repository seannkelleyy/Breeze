import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeButton } from '@/components/shared/BreezeButton'
import { BreezeText } from '@/components/shared/BreezeText'
import { Link } from 'react-router-dom'

export const ErrorPage = () => {
	return (
		<BreezeBox
			title='Error'
			style={{
				position: 'fixed',
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				textAlign: 'center',
			}}
		>
			<BreezeText
				text={<u>BREEZE</u>}
				type='title'
			/>
			<BreezeText
				text='The page you are looking for does not exist.'
				type='large-heading'
				style={{
					padding: '1rem',
				}}
			/>
			<Link to='/'>
				<BreezeButton content='Go Home' />
			</Link>
		</BreezeBox>
	)
}
