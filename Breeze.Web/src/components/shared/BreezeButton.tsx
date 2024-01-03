import './shared.css'

type BreezeButtonProps = {
	text: string
	onClick: () => void
}

export const BreezeButton = (props: BreezeButtonProps) => {
	return (
		<button
			className='breeze-button'
			onClick={props.onClick}
		>
			{props.text}
		</button>
	)
}
