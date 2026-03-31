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
    const internalInputRef = useRef<HTMLInputElement | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const originalValue = input.value;
      const selectionStart = input.selectionStart || 0;

      // Count "real" characters (numbers and V/E) before current cursor
      const beforeCursor = originalValue.substring(0, selectionStart);
      const cleanBeforeCursor = beforeCursor.replace(/[^VE0-9]/g, '');
      const realCharsBeforeCount = cleanBeforeCursor.length;

      const formatted = formatCedula(originalValue);
      onFormChange(formatted);

      // After formatting, find the new cursor position
      requestAnimationFrame(() => {
        if (internalInputRef.current) {
          let newPos = 0;
          let foundRealChars = 0;
          
          for (let i = 0; i < formatted.length; i++) {
            if (foundRealChars >= realCharsBeforeCount) break;
            const char = formatted[i];
            if (/[VE0-9]/.test(char || '')) {
              foundRealChars++;
            }
            newPos = i + 1;
          }

          // Special case: if we just added a formatting character (like the hyphen or a dot) 
          // right after the character we typed, we should stay after that formatting char
          // to provide a better UX when typing at the end.
          if (newPos < formatted.length && !/[VE0-9]/.test(formatted[newPos] || '')) {
             // If the next char is a dot or hyphen, skip it if we are at the end of what we typed
             if (selectionStart === originalValue.length) {
                newPos++;
             }
          }

          internalInputRef.current.setSelectionRange(newPos, newPos);
        }
      });
    };

    return (
      <Input
        ref={(node) => {
          internalInputRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        type="text"
        value={propValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="V-XX.XXX.XXX"
        className={cn("font-mono", className)}
        disabled={disabled}
        maxLength={15}
        autoComplete="off"
        name={name}
        id={id}
        {...props}
      />
    );
  }
);
CedulaInput.displayName = 'CedulaInput';
