import { useNavigate } from 'react-router-dom'
import { BreezeButton } from './BreezeButton'

export const BackButton = () => {
	const navigate = useNavigate()
	return (
		<BreezeButton
			text={
				<img
					src='./arrow-left.svg'
					alt='back'
				/>
			}
			style={{
				position: 'absolute',
				top: '2%',
				left: '3%',
				padding: '.5em',
			}}
			onClick={() => {
				navigate(-1)
			}}
		/>
	)
}