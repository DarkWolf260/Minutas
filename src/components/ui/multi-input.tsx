
"use client"

import React, { useState, KeyboardEvent, useRef } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { X, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface MultiInputProps {
    value: string[];
    onChange: (value: string[] | string) => void;
    options?: string[];
    placeholder?: string;
    disabled?: boolean;
    isSingle?: boolean;
}

export function MultiInput({ value = [], onChange, options = [], placeholder, disabled, isSingle = false }: MultiInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAddValue = (newValue: string) => {
        const trimmed = newValue.trim();
        if (isSingle) {
            onChange(trimmed);
        } else {
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed]);
            }
        }
        setInputValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddValue(inputValue);
            setOpen(false);
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0 && !isSingle) {
            const lastValue = value[value.length - 1];
            if (lastValue) handleRemoveValue(lastValue);
        }
    };

    const handleRemoveValue = (valueToRemove: string) => {
        onChange(value.filter(v => v !== valueToRemove));
    };

    const handleSelectOption = (option: string) => {
        handleAddValue(option);
        setOpen(false);
        inputRef.current?.focus();
    };

    const displayValue = isSingle ? (Array.isArray(value) ? (value[0] || '') : value) : inputValue;

    const currentValuesSet = new Set(value);

    const filteredOptions = options.filter(option =>
        !currentValuesSet.has(option) && option.toLowerCase().includes(displayValue.toLowerCase())
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
                    {!isSingle && value.map(item => (
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
                        value={isSingle ? (Array.isArray(value) ? (value[0] || '') : (value || '')) : inputValue}
                        onChange={(e) => {
                            if (isSingle) {
                                onChange(e.target.value);
                            } else {
                                setInputValue(e.target.value);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 border-0 shadow-none focus-visible:ring-0 p-0 h-8 bg-transparent min-w-[100px]"
                    />
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="p-1 max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <Button
                                key={option}
                                variant="ghost"
                                className="w-full justify-start h-8 px-2 font-normal"
                                onClick={() => handleSelectOption(option)}
                            >
                                {option}
                            </Button>
                        ))
                    ) : (
                        <p className="p-2 text-center text-xs text-muted-foreground">
                            {options.length > 0 && currentValuesSet.size === options.length ? 'Todas las opciones seleccionadas.' : 'No hay opciones disponibles.'}
                        </p>
                    )}
                    {displayValue && !options.includes(displayValue) && !currentValuesSet.has(displayValue) && (
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-8 px-2 font-normal text-primary"
                            onClick={() => handleSelectOption(displayValue)}
                        >
                            Añadir "{displayValue}"
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
