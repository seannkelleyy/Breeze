import { BreezeBox } from '@/components/shared/BreezeBox'

export const Loading = () => {
	return (
		<BreezeBox
			title='Loading'
			style={{
				position: 'fixed',
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div className='loader'></div>
		</BreezeBox>
	)
}
