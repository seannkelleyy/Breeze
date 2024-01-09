import './shared.css'

type BreezeButtonProps = {
	text: string
	onClick: () => void
}

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
