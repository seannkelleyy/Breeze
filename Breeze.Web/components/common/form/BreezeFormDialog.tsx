import { ReactNode, useState } from 'react';

import { FieldValues, UseFormReturn } from '@/node_modules/react-hook-form/dist';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { BreezeDialog } from '../dialog/BreezeDialog';

interface BreezeFormDialogProps<TFormValues extends FieldValues> {
  dialogTrigger: ReactNode;
  title: string;
  description: string;
  itemType: string;
  form: UseFormReturn<TFormValues>;
  onSubmit: (values: TFormValues) => void;
  inputFields: ReactNode;
  destructiveElements?: ReactNode;
  dialogContentClassName?: string;
  footerClassName?: string;
  disableSubmitUntilValid?: boolean;
}
/**
 * Reusable form dialog component that integrates with react-hook-form and BreezeDialog.
 */
export const BreezeFormDialog = <TFormValues extends FieldValues>({
  dialogTrigger,
  title,
  description,
  form,
  itemType,
  onSubmit,
  inputFields,
  destructiveElements,
  dialogContentClassName,
  footerClassName,
  disableSubmitUntilValid = true,
}: BreezeFormDialogProps<TFormValues>) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleSubmit = (values: TFormValues) => {
    onSubmit(values);
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <BreezeDialog
      dialogTrigger={dialogTrigger}
      title={title}
      description={description}
      open={open}
      onOpenChange={setOpen}
      dialogContentClassName={dialogContentClassName}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {inputFields}
        <DialogFooter
          className={footerClassName ?? 'flex w-full flex-row items-center justify-center gap-2'}
        >
          {destructiveElements ? (
            destructiveElements
          ) : (
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting || (disableSubmitUntilValid && !form.formState.isValid)
            }
          >
            {form.formState.isSubmitting ? 'Saving...' : `Save ${itemType}`}
          </Button>
        </DialogFooter>
      </form>
    </BreezeDialog>
  );
};
