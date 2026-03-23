'use client';
import { Controller, FieldValues, Path, UseFormReturn } from '@/node_modules/react-hook-form/dist';
import { Input } from '@/components/ui/input';

type FormInputFieldProps<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
  name: Path<TFormValues>;
  label: string;
  placeholder?: string;
  type?: string;
  hideLabel?: boolean;
};

/**
 * FormInputField component for rendering a controlled input field using shadcn/ui and React Hook Form Controller.
 */
export const FormInputField = <TFormValues extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  hideLabel = false,
}: FormInputFieldProps<TFormValues>) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <div data-slot="field" data-invalid={fieldState.invalid} className="flex flex-col gap-2">
          <label htmlFor={name} className={hideLabel ? 'sr-only' : 'text-sm font-medium'}>
            {label}
          </label>
          <Input
            id={name}
            type={type}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            {...field}
            onChange={(e) => {
              const value = e.target.value;
              if (type === 'number') {
                const numValue = value === '' ? 0 : parseFloat(value);
                field.onChange(isNaN(numValue) ? 0 : numValue);
              } else {
                field.onChange(value);
              }
            }}
            value={type === 'number' ? String(field.value || '') : field.value}
          />
          {fieldState.invalid && fieldState.error?.message && (
            <div role="alert" className="text-destructive text-sm">
              {fieldState.error.message}
            </div>
          )}
        </div>
      )}
    />
  );
};
