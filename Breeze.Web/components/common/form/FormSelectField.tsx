'use client'
import { Controller, FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Option type for select dropdown
type Option = {
	value: string
	label: string
}

type FormSelectFieldProps<TFormValues extends FieldValues> = {
	form: UseFormReturn<TFormValues>
	name: Path<TFormValues>
	label: string
	options: Option[]
	placeholder?: string
	parseAsNumber?: boolean
}

/**
 * FormSelectField component for rendering a controlled select dropdown using shadcn/ui and React Hook Form Controller.
 */
export const FormSelectField = <TFormValues extends FieldValues>({ form, name, label, options, placeholder, parseAsNumber = true }: FormSelectFieldProps<TFormValues>) => {
	return (
		<Controller
			control={form.control}
			name={name}
			render={({ field, fieldState }) => (
				<div
					data-slot='field'
					data-invalid={fieldState.invalid}
					className='flex flex-col gap-2'
				>
					<label
						htmlFor={name}
						className='text-sm font-medium'
					>
						{label}
					</label>
					<Select
						name={name}
						value={field.value == null ? '' : String(field.value)}
						onValueChange={(value) => field.onChange(parseAsNumber ? Number(value) : value)}
					>
						<SelectTrigger
							id={name}
							aria-invalid={fieldState.invalid}
						>
							<SelectValue placeholder={placeholder || 'Select an option'} />
						</SelectTrigger>
						<SelectContent>
							{options.map((opt) => (
								<SelectItem
									key={opt.value}
									value={opt.value}
								>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{fieldState.invalid && fieldState.error?.message && (
						<div
							role='alert'
							className='text-sm text-destructive'
						>
							{fieldState.error.message}
						</div>
					)}
				</div>
			)}
		/>
	)
}

