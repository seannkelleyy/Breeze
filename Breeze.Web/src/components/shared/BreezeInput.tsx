import './shared.css'

type BreezeInputProps = {
	type: string
	title: string
	placeholder: string
	onBlur?: (e: React.FocusEvent<HTMLInputElement> | null) => void
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const BreezeInput = (props: BreezeInputProps) => {
	const { type, title, placeholder, onBlur, onChange } = props
	return (
		<input
			className='breeze-input'
			type={type}
			title={title}
			placeholder={placeholder}
			onChange={onChange}
			onBlur={onBlur}
		/>
	)
}
