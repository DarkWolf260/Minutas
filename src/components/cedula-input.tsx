'use client';

import { useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const formatCedula = (value: string): string => {
  if (!value) return '';

  let cleaned = value.toUpperCase().replace(/[^VE0-9]/g, '');
  let prefix = '';
  if (cleaned.startsWith('V') || cleaned.startsWith('E')) {
    prefix = cleaned.charAt(0);
    cleaned = cleaned.substring(1);
  }

  cleaned = cleaned.replace(/\D/g, ''); // Keep only numbers

  if (!prefix) return cleaned;

  // Format numbers with dots as thousand separators
  const formattedNumber = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${prefix}-${formattedNumber}`;
};

const getCursorPosition = (value: string): number => {
  return value.length;
};

export function CedulaInput({
  value: propValue,
  onChange: onFormChange,
  disabled = false,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  [key: string]: any;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const formatted = formatCedula(inputVal);
    onFormChange(formatted);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const cursorPosition = getCursorPosition(inputVal);
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={propValue}
      onChange={handleChange}
      placeholder="V-XX.XXX.XXX"
      className="font-mono"
      disabled={disabled}
      maxLength={12}
      {...props}
    />
  );
}
