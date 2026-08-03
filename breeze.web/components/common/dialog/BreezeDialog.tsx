import { ReactNode, useState } from 'react';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BreezeDialogProps {
  dialogTrigger: ReactNode;
  title: string;
  description: string | ReactNode;
  footerActions?: ReactNode;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogContentClassName?: string;
}

/**
 * Reusable dialog component with consistent styling and behavior.
 * @param {ReactNode} dialogTrigger - Element that triggers the dialog when clicked.
 * @param {string} title - Title of the dialog.
 * @param {string | ReactNode} description - Description or content of the dialog.
 * @param {ReactNode} footerActions - Optional footer actions (e.g., buttons).
 * @param {ReactNode} children - Content to be displayed inside the dialog.
 * @param {boolean} open - Optional controlled open state.
 * @param {(open: boolean) => void} onOpenChange - Optional controlled open state change handler.
 * @returns {JSX.Element} The BreezeDialog component.
 */
export const BreezeDialog = ({
  dialogTrigger,
  title,
  description,
  children,
  footerActions,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  dialogContentClassName,
}: BreezeDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent
        className={cn(
          'max-h-[90vh] max-w-[95%] overflow-y-auto rounded-md md:max-w-[400px]',
          dialogContentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {footerActions && <DialogFooter>{footerActions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};
