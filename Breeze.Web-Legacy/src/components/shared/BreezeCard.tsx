import { ReactNode } from 'react'
import './shared.css'

type BreezeCardProps = {
	children: ReactNode[] | ReactNode
	title: string
	secondary?: boolean
	style?: React.CSSProperties
}

/**
 * Simple card used in Breeze, comes standard with default Breeze styling.
 * This component is used where white background around components is needed.
 * @param props.children: The children of the card.
 * @param props.title: The title of the card.
 * @param props.secondary: - Optional - Changes color of card to better go above other cards
 * @param props.style: - Optional - The style of the card.
 */
export const BreezeCard = ({ children, title, secondary, style }: BreezeCardProps) => {
	return (
		<section
			className='breeze-card'
			title={title}
			style={{
				...(secondary && { backgroundColor: 'var(--color-card-background-secondary)' }),
				...style,
			}}
		>
			{children}
		</section>
	)
}
