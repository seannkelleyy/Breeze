import { ReactNode } from 'react'
import './shared.css'

type BreezeButtonProps = {
	text: string | ReactNode
	onClick: () => void
	size?: 'small' | 'medium' | 'large'
	style?: React.CSSProperties
}

/**
 * Simple button used in Breeze, comes standard with default Breeze styling.
 * @param props.text: The text of the button.
 * @param props.onClick: The onClick function of the button.
 * @param props.style: - Optional - The style of the button.
 */
export const BreezeButton = (props: BreezeButtonProps) => {
	const { text, onClick, style, size } = props
	const className = size ? 'breeze-button-' + size : 'breeze-button'

	return (
		<button
			className={className}
			onClick={onClick}
			style={style}
		>
			{text}
		</button>
	)
}
