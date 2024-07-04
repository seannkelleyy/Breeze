/* eslint-disable @typescript-eslint/no-explicit-any */
import './shared.css'
import { BreezeBox } from './BreezeBox'
import { BreezeText } from './BreezeText'
import { forwardRef } from 'react'

type BreezeInputProps = {
	type: string
	title: string
	placeholder: string
	label?: string
	defaultValue?: string
	selectAllOnClick?: boolean
	style?: React.CSSProperties
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}
/**
 * Simple replacement for inputs in Breeze, comes standard with default Breeze styling.
 * @param type: The type of the input.
 * @param title: The title of the input.
 * @param placeholder: The placeholder of the input.
 * @param label: - Optional - The label of the input.
 * @param defaultValue: - Optional - The default value of the input.
 * @param selectAllOnClick: - Optional - A boolean that determines if the input selects all text on click.
 * @param onBlur: - Optional - The onBlur function of the input.
 * @param onChange: - Optional - The onChange function of the input.
 * @param style: - Optional - The style of the input.
 */
export const BreezeInput = forwardRef<HTMLInputElement, BreezeInputProps>(
	({ type, title, placeholder, label, defaultValue, selectAllOnClick, style, onBlur, onChange, ...field }, ref) => {
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
						text={label}
						style={{
							alignSelf: 'self-start',
						}}
					/>
				)}
				<input
					ref={ref}
					className='breeze-input'
					type={type}
					title={title}
					placeholder={placeholder}
					defaultValue={defaultValue}
					{...field}
					onClick={selectAllOnClick ? (e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.select() : undefined}
					style={style}
					onBlur={onBlur}
					onChange={onChange}
				/>
			</BreezeBox>
		)
	},
)
