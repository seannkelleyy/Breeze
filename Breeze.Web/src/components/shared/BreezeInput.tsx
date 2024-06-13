import './shared.css'

type BreezeInputProps = {
	type: string
	title: string
	placeholder: string
	defaultValue?: string
	onBlur?: (e: React.FocusEvent<HTMLInputElement> | null) => void
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
	style?: React.CSSProperties
}

/**
 * Simple replacement for inputs in Breeze, comes standard with default Breeze styling.
 * @param type: The type of the input.
 * @param title: The title of the input.
 * @param placeholder: The placeholder of the input.
 * @param onBlur: - Optional - The onBlur function of the input.
 * @param onChange: - Optional - The onChange function of the input.
 * @param style: - Optional - The style of the input.
 */
export const BreezeInput = ({ type, title, placeholder, defaultValue, onBlur, onChange, style }: BreezeInputProps) => {
	return (
		<input
			className='breeze-input'
			type={type}
			title={title}
			placeholder={placeholder}
			defaultValue={defaultValue}
			onChange={onChange}
			onBlur={onBlur}
			style={style}
		/>
	)
}
