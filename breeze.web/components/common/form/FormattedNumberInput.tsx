'use client';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

type FormattedNumberInputProps = {
  id?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  maxFractionDigits?: number;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

const isValidNumber = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim();
  if (cleaned === '') return false;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed);
};

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number, maxFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

export const FormattedNumberInput = ({
  id,
  value,
  onValueChange,
  min = 0,
  maxFractionDigits = 0,
  placeholder,
  inputMode = 'decimal',
}: FormattedNumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftValue(String(value));
      setError(null);
    }
  }, [value, isFocused]);

  const commitValue = (rawValue: string) => {
    const cleaned = rawValue.replace(/,/g, '').trim();
    if (cleaned === '') {
      onValueChange(min);
      setDraftValue(String(min));
      setError(null);
      return;
    }

    if (!isValidNumber(rawValue)) {
      setError('Please enter a valid number');
      return;
    }

    const parsedValue = clamp(parseNumber(rawValue), min);
    onValueChange(parsedValue);
    setDraftValue(String(parsedValue));
    setError(null);
  };

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        className={error ? 'border-destructive' : ''}
        value={isFocused ? draftValue : formatNumber(value, maxFractionDigits)}
        onFocus={() => {
          setIsFocused(true);
          setDraftValue(String(value));
          setError(null);
        }}
        onChange={(event) => {
          setDraftValue(event.target.value);
          setError(null);
        }}
        onBlur={() => {
          setIsFocused(false);
          commitValue(draftValue);
        }}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
};
