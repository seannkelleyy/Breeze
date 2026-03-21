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

const parseNumber = (value: string) => {
  const parsed = Number(value);
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

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(String(value));
    }
  }, [value, isFocused]);

  const commitValue = (rawValue: string) => {
    const parsedValue = clamp(parseNumber(rawValue.replace(/,/g, '')), min);
    onValueChange(parsedValue);
    setDraftValue(String(parsedValue));
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode={inputMode}
      placeholder={placeholder}
      value={isFocused ? draftValue : formatNumber(value, maxFractionDigits)}
      onFocus={() => {
        setIsFocused(true);
        setDraftValue(String(value));
      }}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={() => {
        setIsFocused(false);
        commitValue(draftValue);
      }}
    />
  );
};
