import { X } from 'lucide-react'
import { BreezeButton } from './BreezeButton'
import { BreezeCard } from './BreezeCard'

type BreezeModalProps = {
	title: string
	isLoading?: boolean
	children: React.ReactNode
	onClose: () => void
	style?: React.CSSProperties
}

/**
 * A modal that shows when the user clicks the logout button.
 * @param props.title: The title of the modal.
 * @param props.isLoading: - optional - A boolean that determines if the modal is loading.
 * @param props.children: The children of the modal.
 * @param props.onClose: A function that closes the modal.
 * @param props.style: - Optional - The style of the breeze box.

 */
export const BreezeModal = ({ title, isLoading, children, onClose, style }: BreezeModalProps) => {
	return (
		<>
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					background: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(5px)',
					zIndex: 1,
				}}
				onClick={onClose}
			/>
			<BreezeCard
				title={title}
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: '100%',
					padding: '10vh 1em',
					borderRadius: '1em',
					boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
					zIndex: 2,
					...style,
				}}
			>
				<BreezeButton
					content={<X />}
					onClick={onClose}
					style={{
						position: 'absolute',
						top: '1rem',
						right: '1rem',
						background: 'none',
						boxShadow: 'none',
						zIndex: 3,
					}}
				/>
				{isLoading ? <p>Loading... </p> : children}
			</BreezeCard>
		</>
	)
}
