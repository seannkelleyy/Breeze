import { ReactNode } from 'react'

type BreezeTextProps = {
	text: string | ReactNode
	type: 'small' | 'medium' | 'large' | 'small-heading' | 'large-heading' | 'title'
	style?: React.CSSProperties
}

/**
 * Simple and easy replacement for text in Breeze, comes standard with default Breeze styling.
 * @param props.text: The text of the component.
 * @param props.type: The type of the text component. Ex: medium, small-heading, title.
 * @param props.style: - Optional - The style of the text component.
 */
export const BreezeText = ({ text, type, style }: BreezeTextProps) => {
	return (
		<p
			className={`breeze-text-${type}`}
			style={style}
		>
			{text}
		</p>
	)
}
