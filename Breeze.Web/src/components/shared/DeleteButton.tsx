import { BreezeButton } from './BreezeButton'

type DeleteButtonProps = {
	onClick: () => void
	style?: React.CSSProperties
}

export const DeleteButton = ({ onClick, style }: DeleteButtonProps) => {
	return (
		<BreezeButton
			content={
				<img
					className='svg-icon'
					src='/trash.svg'
					alt='Delete'
				/>
			}
			onClick={onClick}
			style={{
				padding: '0',
				margin: '0',
				backgroundColor: 'transparent',
				boxShadow: 'none',
				...style,
			}}
		/>
	)
}
