import { ReactNode } from 'react'
import './shared.css'

type BreezeCardProps = {
	children: ReactNode[] | ReactNode
	title: string
	style?: React.CSSProperties
}

/**
 * Simple card used in Breeze, comes standard with default Breeze styling.
 * This component is used where white background around components is needed.
 * @param props.children: The children of the card.
 * @param props.title: The title of the card.
 * @param props.style: - Optional - The style of the card.
 */
export const BreezeCard = (props: BreezeCardProps) => {
	const { children, title, style } = props
	return (
		<section
			className='breeze-card'
			title={title}
			style={style}
		>
			{children}
		</section>
	)
}
