import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'

type ConfirmationModalProps = {
	open: boolean
	itemType: string
	onOpenChange: (open: boolean) => void
	onDelete: () => void
}

export const ConfirmationModal = ({ open, itemType, onOpenChange, onDelete }: ConfirmationModalProps) => {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>Are you sure you want to delete this {itemType}? This action cannot be undone.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant='destructive'
						onClick={onDelete}
					>
						Delete
					</Button>
					<Button onClick={() => onOpenChange(false)}>Cancel</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

