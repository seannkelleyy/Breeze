'use client';
import { useState } from 'react';

import { Trash } from 'lucide-react';

import { BreezeDialog } from './BreezeDialog';
import { Button } from '@/components/ui/button';

interface DeleteDialogProps {
  itemType: string;
  additionalText?: string | React.ReactNode;
  onDelete: () => void;
}

/**
 * A reusable dialog that prompts the user to confirm deletion of an item.
 * @param {string} itemType - The type of item being deleted (e.g., "category", "income").
 * @param {string | React.ReactNode} [additionalText] - Additional text to display in the dialog.
 * @param {function} onDelete - Callback function to execute when the user confirms deletion.
 * @returns {JSX.Element} The DeleteConfirmationDialog component.
 */
const DeleteDialog = ({ itemType, additionalText, onDelete }: DeleteDialogProps) => {
  const [open, setOpen] = useState(false);

  const dialogTrigger = (
    <button
      className="bg-destructive flex h-8 w-8 items-center justify-center rounded-md p-1 hover:cursor-pointer"
      onClick={() => setOpen(true)}
    >
      <Trash />
    </button>
  );

  const dialogDescription = (
    <>
      Are you sure you want to delete this {itemType}? This action cannot be undone.
      {additionalText && (
        <span className="text-destructive mt-2 block text-center font-bold">{additionalText}</span>
      )}
    </>
  );

  const footerActions = (
    <div className="flex w-full flex-row items-center justify-center gap-2">
      <Button onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={onDelete} className="hover:cursor-pointer">
        Delete
      </Button>
    </div>
  );

  return (
    <BreezeDialog
      open={open}
      onOpenChange={setOpen}
      dialogTrigger={dialogTrigger}
      title="Are you sure?"
      description={dialogDescription}
      footerActions={footerActions}
    />
  );
};

export default DeleteDialog;
