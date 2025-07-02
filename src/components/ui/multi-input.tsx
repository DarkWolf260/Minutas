
"use client"

import React, { useState, KeyboardEvent, useRef } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { X, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MultiInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    options?: string[];
    placeholder?: string;
    disabled?: boolean;
}

export function MultiInput({ value = [], onChange, options = [], placeholder, disabled }: MultiInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAddValue = (newValue: string) => {
        const trimmed = newValue.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddValue(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            handleRemoveValue(value[value.length - 1]);
        }
    };

    const handleRemoveValue = (valueToRemove: string) => {
        onChange(value.filter(v => v !== valueToRemove));
    };

    const filteredOptions = options.filter(option => 
        !value.includes(option) && option.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div 
                    role="combobox" 
                    aria-expanded={open} 
                    className={cn(
                        "flex flex-wrap items-center gap-2 rounded-md border border-input p-1.5 min-h-10 relative",
                        disabled && "cursor-not-allowed opacity-50 bg-muted"
                    )}
                    onClick={() => !disabled && inputRef.current?.focus()}
                >
                    {value.map(item => (
                        <Badge key={item} variant="secondary" className="gap-1.5 pr-1 text-sm">
                            {item}
                            {!disabled && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveValue(item); }} className="rounded-full hover:bg-muted-foreground/20">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 border-0 shadow-none focus-visible:ring-0 p-0 h-8 bg-transparent min-w-[100px]"
                    />
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <ScrollArea className="max-h-60">
                     <div className="p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <Button
                                    key={option}
                                    variant="ghost"
                                    className="w-full justify-start h-8 px-2 font-normal"
                                    onClick={() => {
                                        handleAddValue(option);
                                        inputRef.current?.focus();
                                    }}
                                >
                                    {option}
                                </Button>
                            ))
                        ) : (
                             <p className="p-2 text-center text-xs text-muted-foreground">
                                {options.length > 0 && value.length === options.length ? 'Todas las opciones seleccionadas.' : 'No hay opciones disponibles.'}
                            </p>
                        )}
                        {inputValue && (
                             <Button
                                variant="ghost"
                                className="w-full justify-start h-8 px-2 font-normal text-primary"
                                onClick={() => {
                                    handleAddValue(inputValue);
                                    inputRef.current?.focus();
                                }}
                            >
                                Añadir "{inputValue}"
                            </Button>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
