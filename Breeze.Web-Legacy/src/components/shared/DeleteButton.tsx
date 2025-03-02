import { Trash } from 'lucide-react'
import { BreezeButton } from './BreezeButton'

type DeleteButtonProps = {
	onClick: () => void
	style?: React.CSSProperties
}

/**
 * Simple delete button used in Breeze, comes standard with default Breeze styling.
 * @param props.onClick: The onClick function of the delete button.
 * @param props.style: - Optional - The style of the delete button.
 */
export const DeleteButton = ({ onClick, style }: DeleteButtonProps) => {
	return (
		<BreezeButton
			content={<Trash />}
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
