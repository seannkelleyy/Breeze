import { Pencil } from 'lucide-react'
import { BreezeButton } from './BreezeButton'

type EditButtonProps = {
	onClick: () => void
	style?: React.CSSProperties
}

/**
 * Simple edit button used in Breeze, comes standard with default Breeze styling.
 * @param props.onClick: The onClick function of the delete button.
 * @param props.style: - Optional - The style of the delete button.
 */
export const EditButton = ({ onClick, style }: EditButtonProps) => {
	return (
		<BreezeButton
			content={<Pencil />}
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
