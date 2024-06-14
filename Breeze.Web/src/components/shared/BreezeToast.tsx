import { useState, useEffect } from 'react'
import { BreezeBox } from './BreezeBox'

export type BreezeToastProps = {
	open: boolean
	message: string
	color: 'red' | 'green' | 'yellow'
	duration?: number
}

/***
 * BreezeToast is a component that displays a toast message to the user.
 * @param props.open: A boolean that determines if the toast is visible.
 * @param props.message: The message to display in the toast.
 * @param props.color: The color of the toast. Can be 'red', 'green', or 'yellow'.
 * @param props.duration: - Optional - The duration the toast is visible for. Default is 3000ms.
 */
export const BreezeToast = ({ open, message, color, duration = 3000 }: BreezeToastProps) => {
	const [isOpen, setIsOpen] = useState(open)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsOpen(false)
		}, duration)

		return () => clearTimeout(timer)
	}, [duration])

	if (!isOpen) return null

	return (
		<BreezeBox
			title='Breeze Toast'
			style={{
				position: 'fixed',
				top: '1em',
				left: '50%',
				transform: 'translate(-50%)',
				backgroundColor: color === 'red' ? 'var(--error)' : color === 'green' ? 'var(--success)' : 'var(--warning)',
				padding: '10px',
				minWidth: '50%',
				borderRadius: '5px',
			}}
		>
			{message}
		</BreezeBox>
	)
}
