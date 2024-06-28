/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef } from 'react'
import './shared.css'

type BreezeInputProps = {
	type: string
	title: string
	placeholder: string
	defaultValue?: string
	selectAllOnClick?: boolean
	onBlur?: (e: any) => void
	onChange?: (e: any) => void
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
export const BreezeInput = forwardRef<HTMLInputElement, BreezeInputProps>(({ type, title, placeholder, defaultValue, selectAllOnClick, onBlur, onChange, style }, ref) => {
	return (
		<input
			ref={ref}
			className='breeze-input'
			type={type}
			title={title}
			placeholder={placeholder}
			defaultValue={defaultValue}
			onClick={selectAllOnClick ? (e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.select() : undefined}
			onChange={onChange}
			onBlur={onBlur}
			style={style}
		/>
	)
})
