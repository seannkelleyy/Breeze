import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Button } from '../../ui/button'
import { DialogHeader, DialogFooter } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Expense } from '../../../services/hooks/expense/expenseServices'

type ExpenseModalProps = {
	expense?: Expense
	open: boolean
	onClose: () => void
}

export const ExpenseModal = ({ expense, open, onClose }: ExpenseModalProps) => {
	return (
		<Dialog
			open={open}
			onOpenChange={onClose}
		>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
					<DialogDescription>
						{expense ? "Make changes to your expense here. Click save when you're done." : "Add a new expense entry. Click save when you're done."}
					</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Name</Label>
						<Input
							id='name'
							defaultValue={expense?.name ?? ''}
							className='col-span-3'
						/>
					</div>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Amount</Label>
						<Input
							id='amount'
							type='number'
							defaultValue={expense?.amount ?? 0}
							className='col-span-3'
						/>
					</div>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Date</Label>
						<Input
							id='date'
							type='date'
							defaultValue={expense?.date ?? ''}
							className='col-span-3'
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type='submit'>{expense ? 'Save changes' : 'Add Expense'}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

