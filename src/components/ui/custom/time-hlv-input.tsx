'use client';

import { useMemo, useRef, ChangeEvent, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MAX_DIGITS = 8;

// This function takes a string of digits and formats it.
const formatHlv = (digits: string): string => {
  // If there are no digits, return an empty string.
  // The input will then show its placeholder.
  if (!digits) return '';

  let result = '';

  // Format the first time part (e.g., 14:30)
  const part1 = digits.slice(0, 4);
  result += `${part1.slice(0, 2).padEnd(2, '-')}:${part1.slice(2, 4).padEnd(2, '-')}`;
  result += ' HLV';

  // If there are more than 4 digits, it's a range.
  if (digits.length > 4) {
    result += ' - ';
    const part2 = digits.slice(4, 8);
    result += `${part2.slice(0, 2).padEnd(2, '-')}:${part2.slice(2, 4).padEnd(2, '-')}`;
    result += ' HLV';
  }

  return result;
};

// Calculates the correct cursor position after formatting.
const getCursorPosition = (digitCount: number): number => {
  if (digitCount <= 2) return digitCount; // e.g., "12|"
  if (digitCount <= 4) return digitCount + 1; // e.g., "12:34|"

  // After 4 digits, we are in range mode. "12:34 HLV - " is 12 chars.
  const baseForRange = 12;
  const rangeDigits = digitCount - 4;

  if (rangeDigits <= 2) return baseForRange + rangeDigits;
  if (rangeDigits <= 4) return baseForRange + rangeDigits + 1;

  return 21; // Max length: "12:34 HLV - 12:34 HLV" is 21 chars
};

interface TimeHlvInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string; // Added className
  onBlur?: () => void; // Added onBlur
  name?: string;
  id?: string;
}

export const TimeHlvInput = forwardRef<HTMLInputElement, TimeHlvInputProps>(
  ({ value: propValue, onChange: onFormChange, disabled = false, className, onBlur, name, id }, ref) => {
    const internalInputRef = useRef<HTMLInputElement | null>(null);

    // Extract only digits from the prop value
    const digits = useMemo(() => (propValue || '').replace(/\D/g, ''), [propValue]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newRawValue = e.target.value;
      const newDigits = newRawValue.replace(/\D/g, '').slice(0, MAX_DIGITS);

      const formatted = formatHlv(newDigits);
      onFormChange(formatted);

      // After the state updates and re-renders, set the cursor position correctly.
      setTimeout(() => {
        if (internalInputRef.current) {
          const cursorPosition = getCursorPosition(newDigits.length);
          internalInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    };

    // On blur, validate and correct the time if needed (e.g., 25:00 -> 23:59)
    const handleBlur = () => {
      if (!digits) {
        if (onBlur) onBlur(); // Call external onBlur even if no digits
        return;
      }
      let correctedDigits = digits;

      // Correct start time
      if (correctedDigits.length >= 2) {
        let hours = parseInt(correctedDigits.slice(0, 2), 10);
        if (hours > 23) {
          correctedDigits = '23' + correctedDigits.slice(2);
        }
      }
      if (correctedDigits.length >= 4) {
        let minutes = parseInt(correctedDigits.slice(2, 4), 10);
        if (minutes > 59) {
          correctedDigits = correctedDigits.slice(0, 2) + '59' + correctedDigits.slice(4);
        }
      }

      // Correct end time if it's a range
      if (correctedDigits.length > 4) {
        if (correctedDigits.length >= 6) {
          let endHours = parseInt(correctedDigits.slice(4, 6), 10);
          if (endHours > 23) {
            correctedDigits = correctedDigits.slice(0, 4) + '23' + correctedDigits.slice(6);
          }
        }
        if (correctedDigits.length >= 8) {
          let endMinutes = parseInt(correctedDigits.slice(6, 8), 10);
          if (endMinutes > 59) {
            correctedDigits = correctedDigits.slice(0, 6) + '59';
          }
        }
      }

      // If we corrected anything, update the form.
      if (correctedDigits !== digits) {
        onFormChange(formatHlv(correctedDigits));
      }

      // Call external onBlur
      if (onBlur) onBlur();
    };

    const formattedValue = useMemo(() => formatHlv(digits), [digits]);

    return (
      <>
        <Input
          ref={(node) => {
            internalInputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as any).current = node;
          }}
          type="text"
          value={formattedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="--:-- HLV"
          className={cn("font-mono", className)}
          disabled={disabled}
          autoComplete="off"
          name={name}
          id={id}
        />
      </>
    );
  }
);
TimeHlvInput.displayName = 'TimeHlvInput';
