'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  value: string; // expecting YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
  name?: string;
  id?: string;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, disabled, className, onBlur, name, id }, ref) => {
    // value is 'YYYY-MM-DD'. new Date() will parse this as UTC midnight.
    // To show the correct day in the user's timezone, we need to treat it as a local date.
    const dateCandidate = value ? new Date(value + 'T00:00:00') : undefined;
    const date =
      dateCandidate && !isNaN(dateCandidate.getTime()) ? dateCandidate : undefined;

    const handleSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        // format to YYYY-MM-DD to store consistently
        onChange(format(selectedDate, 'yyyy-MM-dd'));
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
            onBlur={onBlur}
            name={name}
            id={id}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              (() => {
                const formatted = format(date, 'dd/MMMM/yyyy', { locale: es });
                const parts = formatted.split('/');
                const month = parts[1];
                if (parts.length === 3 && month) {
                  parts[1] = month.charAt(0).toUpperCase() + month.slice(1);
                  return parts.join('/');
                }
                return formatted;
              })()
            ) : (
              <span>Selecciona una fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = 'DatePicker';
