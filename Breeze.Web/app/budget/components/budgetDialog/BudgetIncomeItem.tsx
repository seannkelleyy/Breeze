'use client'
import { useEffect } from 'react'

import { UseFormReturn } from 'react-hook-form'

import { FormInputField } from '../../../../components/common/form/FormInputField'
import { FormSelectField } from '../../../../components/common/form/FormSelectField'
import { BudgetFormData } from '../../types/budget'
import DeleteDialog from '@/components/common/dialog/DeleteDialog'

type BudgetIncomeItemProps = {
	index: number
	form: UseFormReturn<BudgetFormData>
	deleteIncome: (index: number) => void
}

/**
 * A component representing a single income item in the budget form.
 * @param {number} index - The index of the income item in the form array.
 * @param {UseFormReturn<BudgetFormData>} form - The react-hook-form instance managing the budget form.
 * @param {(index: number) => void} deleteIncome - Function to delete the income at the specified index.
 * @returns {JSX.Element} The rendered income item.
 */
export function BudgetIncomeItem({ index, form, deleteIncome }: BudgetIncomeItemProps) {
	const recurrenceInterval = form.watch(`incomes.${index}.recurrenceInterval`) ?? 'none'

	useEffect(() => {
		if (!['monthly', 'quarterly', 'yearly'].includes(recurrenceInterval)) {
			form.setValue(`incomes.${index}.paydayDayOfMonth`, null, { shouldValidate: true })
		}
	}, [form, index, recurrenceInterval])

	return (
		<section className='rounded-lg border p-4 bg-background/70 space-y-3'>
			<div className='grid grid-cols-1 md:grid-cols-6 gap-3 items-start'>
				<div className='md:col-span-3'>
					<FormInputField
						form={form}
						name={`incomes.${index}.name`}
						label='Name'
						placeholder='Income'
					/>
				</div>
				<div className='md:col-span-1'>
					<FormInputField
						form={form}
						name={`incomes.${index}.amount`}
						label='Amount'
						type='number'
						placeholder='0'
					/>
				</div>
				<div className='md:col-span-2'>
					<FormInputField
						form={form}
						name={`incomes.${index}.date`}
						label='Date'
						type='date'
					/>
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-6 gap-3 items-end'>
				<div className='md:col-span-2'>
					<FormSelectField
						form={form}
						name={`incomes.${index}.recurrenceInterval`}
						label='Pay Interval'
						placeholder='Interval'
						parseAsNumber={false}
						options={[
							{ value: 'none', label: 'One-time' },
							{ value: 'weekly', label: 'Weekly' },
							{ value: 'biweekly', label: 'Biweekly' },
							{ value: 'monthly', label: 'Monthly' },
							{ value: 'quarterly', label: 'Quarterly' },
							{ value: 'yearly', label: 'Yearly' },
						]}
					/>
				</div>
				<div className='md:col-span-1'>
					{['monthly', 'quarterly', 'yearly'].includes(recurrenceInterval) ? (
						<FormInputField
							form={form}
							name={`incomes.${index}.paydayDayOfMonth`}
							label='Payday'
							type='number'
							placeholder='1-31'
						/>
					) : recurrenceInterval === 'none' ? (
						<div className='text-sm text-muted-foreground pb-2'>No payday for one-time income</div>
					) : (
						<div className='text-sm text-muted-foreground pb-2'>Uses Date as pay anchor</div>
					)}
				</div>
				<div className='md:col-span-2' />
				<div className='md:col-span-1 flex md:justify-end pt-1'>
					<DeleteDialog
						key={form.getValues().incomes[index].id}
						itemType='income'
						additionalText={`You are about to delete the income: ${form.getValues().incomes[index].name}`}
						onDelete={() => deleteIncome(index)}
					/>
				</div>
			</div>
		</section>
	)
}

