import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { Label } from '@radix-ui/react-dropdown-menu'
import { Button } from '../../ui/button'
import { DialogHeader, DialogFooter } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Income } from '../../../services/hooks/income/incomeServices'
import { usePostIncome } from '../../../services/hooks/income/usePostIncome'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'

type IncomeModalProps = {
	income?: Income
	open: boolean
	onClose: () => void
}

export const IncomeModal = ({ income, open, onClose }: IncomeModalProps) => {
	const { refetchIncomes, refetchBudget } = useBudgetContext()
	const postMutation = usePostIncome({
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
		},
	})
	return (
		<Dialog
			open={open}
			onOpenChange={onClose}
		>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>{income ? 'Edit Income' : 'Add Income'}</DialogTitle>
					<DialogDescription>
						{income ? "Make changes to your income here. Click save when you're done." : "Add a new income entry. Click save when you're done."}
					</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Name</Label>
						<Input
							id='name'
							defaultValue={income?.name ?? ''}
							className='col-span-3'
						/>
					</div>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Amount</Label>
						<Input
							id='amount'
							type='number'
							defaultValue={income?.amount ?? 0}
							className='col-span-3'
						/>
					</div>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Date</Label>
						<Input
							id='date'
							type='date'
							defaultValue={income?.date ?? ''}
							className='col-span-3'
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={() => postMutation.mutate()}
						type='submit'
					>
						{income ? 'Save changes' : 'Add Income'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

