'use client';

import { useMemo, useRef, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';

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

  // After 4 digits, we are in range mode. "12:34 HLV - " is 13 chars.
  const baseForRange = 13;
  const rangeDigits = digitCount - 4;

  if (rangeDigits <= 2) return baseForRange + rangeDigits;
  if (rangeDigits <= 4) return baseForRange + rangeDigits + 1;

  return 24; // Default to the end
};

export function TimeHlvInput({
  value: propValue,
  onChange: onFormChange,
  disabled = false,
  showHelperText = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showHelperText?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract only digits from the prop value
  const digits = useMemo(() => (propValue || '').replace(/\D/g, ''), [propValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newRawValue = e.target.value;
    const newDigits = newRawValue.replace(/\D/g, '').slice(0, MAX_DIGITS);

    const formatted = formatHlv(newDigits);
    onFormChange(formatted);

    // After the state updates and re-renders, set the cursor position correctly.
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const cursorPosition = getCursorPosition(newDigits.length);
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  // On blur, validate and correct the time if needed (e.g., 25:00 -> 23:59)
  const handleBlur = () => {
    if (!digits) return;
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
  };

  const formattedValue = useMemo(() => formatHlv(digits), [digits]);

  return (
    <>
      <Input
        ref={inputRef}
        type="text"
        value={formattedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="--:-- HLV"
        className="font-mono"
        disabled={disabled}
      />
      {showHelperText && (
        <p className="text-xs text-muted-foreground mt-1">
          Este campo no solo es para la hora de inicio, sigue escribiendo
        </p>
      )}
    </>
  );
}
