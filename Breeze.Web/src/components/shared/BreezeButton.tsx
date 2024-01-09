import { ReactNode } from 'react'
import './shared.css'

type BreezeButtonProps = {
	text: string | ReactNode
	onClick: () => void
	style?: React.CSSProperties
}

/**
 * Simple button used in Breeze, comes standard with default Breeze styling.
 * @param props.text: The text of the button.
 * @param props.onClick: The onClick function of the button.
 * @param props.style: - Optional - The style of the button.
 */
export const BreezeButton = (props: BreezeButtonProps) => {
	const { text, onClick } = props
	return (
		<button
			className='breeze-button'
			onClick={onClick}
		>
			{text}
		</button>
	)
}
