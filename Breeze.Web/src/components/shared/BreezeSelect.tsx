type BreezeSelectProps = {
	title: string
	options: string[]
	disabled?: boolean
	multiple?: boolean
	onBlur?: (e: React.FocusEvent<HTMLSelectElement> | null) => void
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
	style?: React.CSSProperties
}

/**
 * Replacement for select in Breeze, comes standard with default Breeze styling.
 * @param title: The title of the select.
 * @param options: The options of the select.
 * @param disabled: - Optional - The disabled state of the select.
 * @param multiple: - Optional - The multiple state of the select.
 * @param onBlur: - Optional - The onBlur function of the select.
 * @param onChange: - Optional - The onChange function of the select.
 * @param style: - Optional - The style of the select.
 */
export const BreezeSelect = ({ title, options, disabled, multiple, onBlur, onChange, style }: BreezeSelectProps) => {
	return (
		<select
			className='breeze-select'
			title={title}
			disabled={disabled}
			multiple={multiple}
			onChange={onChange}
			onBlur={onBlur}
			style={style}
		>
			{options.map((option) => (
				<option
					className='breeze-select-option'
					key={option}
					value={option}
				>
					{option}
				</option>
			))}
		</select>
	)
}
