import { ReactNode } from 'react'
import './shared.css'

type BreezeButtonProps = {
	content: string | ReactNode
	onClick?: () => void
	size?: 'small' | 'medium' | 'large'
	type?: 'button' | 'reset' | 'submit' | undefined
	disabled?: boolean
	style?: React.CSSProperties
}

/**
 * Simple button used in Breeze, comes standard with default Breeze styling.
 * @param props.content: The text of the button.
 * @param props.onClick: The onClick function of the button.
 * @param props.size: - Optional - The size of the button, small, medium or large.
 * @param props.type: - Optional - The type of button for forms.
 * @param props.disabled: - Optional - Determines whether the button is disabled.
 * @param props.style: - Optional - The style of the button.
 */
export const BreezeButton = ({ content: text, onClick, style, size, type, disabled }: BreezeButtonProps) => {
	const className = size ? 'breeze-button-' + size : 'breeze-button'

	return (
		<button
			className={className}
			onClick={onClick}
			style={style}
			type={type}
			disabled={disabled}
		>
			{text}
		</button>
	)
}
