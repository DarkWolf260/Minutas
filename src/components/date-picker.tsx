
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value: string; // expecting YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  // value is 'YYYY-MM-DD'. new Date() will parse this as UTC midnight.
  // To show the correct day in the user's timezone, we need to treat it as a local date.
  const dateCandidate = value ? new Date(value + 'T00:00:00') : undefined;
  const date = dateCandidate && !isNaN(dateCandidate.getTime()) ? dateCandidate : undefined;

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
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
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
