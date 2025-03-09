import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { DialogTrigger } from '@radix-ui/react-dialog'
import { Trash } from 'lucide-react'
import { useState } from 'react'

type DeleteConfirmationDialogProps = {
	itemType: string
	additionalText?: string | React.ReactNode
	onDelete: () => void
}

/// A dialog that prompts the user to confirm deletion of an item.
///
/// @param itemType - The type of item being deleted.
/// @param additionalText - Additional text to display in the dialog.
/// @param onDelete - The function to call when the user confirms deletion.
///
/// @returns The delete confirmation dialog.
///
export const DeleteConfirmationDialog = ({ itemType, additionalText, onDelete }: DeleteConfirmationDialogProps) => {
	const [open, onOpenChange] = useState(false)

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogTrigger
				asChild
				className='hover:cursor-pointer bg-destructive w-8 h-8 p-1 rounded-md flex items-center justify-center'
			>
				<Trash />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>Are you sure you want to delete this {itemType}? This action cannot be undone.</DialogDescription>
					{additionalText && (
						<DialogDescription>
							<div className='text-center font-bold text-destructive'>{additionalText}</div>
						</DialogDescription>
					)}
				</DialogHeader>
				<DialogFooter>
					<Button
						variant='destructive'
						onClick={onDelete}
						className='hover:cursor-pointer'
					>
						Delete
					</Button>
					<Button onClick={() => onOpenChange(false)}>Cancel</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

