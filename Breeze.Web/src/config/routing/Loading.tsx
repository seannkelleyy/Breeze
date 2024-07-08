import { BreezeBox } from '@/components/shared/BreezeBox'
import { LoadingEffect } from '@/components/shared/LoadingEffect'

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
			<LoadingEffect />
		</BreezeBox>
	)
}
