import { BreezeBox } from './BreezeBox'

/**
 * Loading spinner effect component.
 */
export const LoadingEffect = () => {
	return (
		<BreezeBox
			title='Loader'
			style={{
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div className='loader' />
		</BreezeBox>
	)
}
