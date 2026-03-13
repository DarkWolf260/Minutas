'use client';

import { useRef, ChangeEvent, forwardRef } from 'react';
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

interface CedulaInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  name?: string;
  id?: string;
}

export const CedulaInput = forwardRef<HTMLInputElement, CedulaInputProps>(
  ({ value: propValue, onChange: onFormChange, disabled = false, className, onBlur, name, id, ...props }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const formatted = formatCedula(inputVal);
      onFormChange(formatted);

      requestAnimationFrame(() => {
        if (internalInputRef.current) {
          const cursorPosition = getCursorPosition(inputVal);
          internalInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    };

    return (
      <Input
        ref={(node) => {
          internalInputRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type="text"
        value={propValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="V-XX.XXX.XXX"
        className={cn("font-mono", className)}
        disabled={disabled}
        maxLength={12}
        autoComplete="off"
        name={name}
        id={id}
        {...props}
      />
    );
  }
);
CedulaInput.displayName = 'CedulaInput';
