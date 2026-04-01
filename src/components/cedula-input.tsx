'use client';

import { useRef, ChangeEvent, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCedula = (value: string): string => {
  if (!value) return '';

  const specialValues = ['No indicó', 'No posee'];
  if (specialValues.includes(value)) return value;

  let cleaned = value.toUpperCase().replace(/[^VE0-9]/g, '');
  let prefix = '';
  if (cleaned.startsWith('V') || cleaned.startsWith('E')) {
    prefix = cleaned.charAt(0);
    cleaned = cleaned.substring(1);
  }

  cleaned = cleaned.replace(/\D/g, ''); // Keep only numbers
  cleaned = cleaned.substring(0, 8); // Max 8 digits

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
      setTimeout(() => {
        if (internalInputRef.current) {
          const isAtEnd = selectionStart >= originalValue.length;
          let newPos = 0;

          if (isAtEnd) {
            newPos = formatted.length;
          } else {
            let foundRealChars = 0;
            for (let i = 0; i < formatted.length; i++) {
              if (foundRealChars >= realCharsBeforeCount) break;
              const char = formatted[i];
              if (/[VE0-9]/.test(char || '')) {
                foundRealChars++;
              }
              newPos = i + 1;
            }
          }

          // Force update twice to bypass some React batching behaviors
          internalInputRef.current.setSelectionRange(newPos, newPos);
          requestAnimationFrame(() => {
            if (internalInputRef.current) {
              internalInputRef.current.focus();
              internalInputRef.current.setSelectionRange(newPos, newPos);
            }
          });
        }
      }, 0);
    };

    return (
      <div className="relative flex items-center gap-1 w-full">
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
          className={cn("font-mono pr-10", className)}
          disabled={disabled}
          maxLength={20} // Increased for "No indicó"
          autoComplete="off"
          name={name}
          id={id}
          {...props}
        />
        <div className="absolute right-0 pr-1 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                disabled={disabled}
                type="button"
                tabIndex={-1}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Opciones de cédula</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFormChange('No indicó')}>
                No indicó
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFormChange('No posee')}>
                No posee
              </DropdownMenuItem>
              {propValue && (
                <DropdownMenuItem onClick={() => onFormChange('')} className="text-destructive focus:text-destructive">
                  Limpiar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }
);
CedulaInput.displayName = 'CedulaInput';
