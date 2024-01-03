type BreezeTextProps = {
	text: string
}

export const BreezeText = (props: BreezeTextProps) => {
	const { text } = props
	return <p className='breeze-text'>{text}</p>
}
