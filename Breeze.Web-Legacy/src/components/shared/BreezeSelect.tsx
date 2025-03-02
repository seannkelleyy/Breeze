import { forwardRef } from 'react'
import { BreezeBox } from './BreezeBox'
import { BreezeText } from './BreezeText'

type BreezeSelectProps = {
	title: string
	options: string[]
	label?: string
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
 * @param label: - Optional - The label of the select.
 * @param disabled: - Optional - The disabled state of the select.
 * @param multiple: - Optional - The multiple state of the select.
 * @param onBlur: - Optional - The onBlur function of the select.
 * @param onChange: - Optional - The onChange function of the select.
 * @param style: - Optional - The style of the select.
 */
export const BreezeSelect = forwardRef<HTMLSelectElement, BreezeSelectProps>(({ title, options, label, disabled, multiple, style, onBlur, onChange, ...field }, ref) => {
	return (
		<BreezeBox
			title={title}
			style={{
				width: '100%',
			}}
		>
			{label && (
				<BreezeText
					type='medium'
					text={title}
					style={{
						alignSelf: 'self-start',
					}}
				/>
			)}
			<select
				ref={ref}
				className='breeze-select'
				title={title}
				disabled={disabled}
				multiple={multiple}
				{...field}
				style={style}
				onBlur={onBlur}
				onChange={onChange}
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
		</BreezeBox>
	)
})
