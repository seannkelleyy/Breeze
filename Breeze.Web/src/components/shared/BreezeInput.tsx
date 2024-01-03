import './shared.css'

type BreezeInputProps = {
	type: string
	title: string
	placeholder: string
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const BreezeInput = (props: BreezeInputProps) => {
	const { type, title, placeholder, onChange } = props
	return (
		<input
			className='breeze-input'
			type={type}
			title={title}
			placeholder={placeholder}
			onChange={onChange}
		/>
	)
}
