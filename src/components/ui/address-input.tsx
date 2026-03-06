'use client';

import React, { useState, useMemo, useRef, forwardRef } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useAddresses } from '@/hooks/use-addresses';
import type { Address } from '@/types';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
  isTextarea?: boolean;
}

const formatAddressToString = (address: Address): string => {
  const parts = [`Municipio ${address.municipality}`, `parroquia ${address.parish}`];

  if (address.sector) {
    parts.push(`sector ${address.sector}`);
  }

  const calle = [address.street, address.houseNumber].filter(Boolean).join(' ');
  if (calle) {
    parts.push(`calle ${calle}`);
  }

  parts.push(address.name);
  parts.push(`Cuadrante de Paz ${address.peaceQuadrant}`);

  return parts.join(', ');
};

export const AddressInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, AddressInputProps>(
  ({ value, onChange, placeholder, disabled, className, onBlur, isTextarea }, ref) => {
    const { addresses, isLoaded } = useAddresses();
    const [open, setOpen] = useState(false);
    const internalInputRef = useRef<HTMLInputElement>(null);

    const filteredAddresses = useMemo(() => {
      if (!value) return addresses;
      const lowercasedValue = value.toLowerCase();

      const isAFormattedAddress = addresses.some(
        (addr) => formatAddressToString(addr).toLowerCase() === lowercasedValue
      );
      if (isAFormattedAddress) {
        return addresses;
      }

      return addresses.filter((address) =>
        formatAddressToString(address).toLowerCase().includes(lowercasedValue)
      );
    }, [addresses, value]);

    const handleSelect = (address: Address) => {
      const formattedAddress = formatAddressToString(address);
      onChange(formattedAddress);
      setOpen(false);
      internalInputRef.current?.blur();
    };

    if (!isLoaded) {
      return <Skeleton className="h-10 w-full" />;
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <div className="relative">
            {isTextarea ? (
              <Textarea
                ref={(node) => {
                  internalInputRef.current = node as any;
                  if (typeof ref === 'function') ref(node);
                  else if (ref) (ref as React.MutableRefObject<any>).current = node;
                }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'Selecciona o escribe una dirección...'}
                disabled={disabled}
                className={cn("pr-8 min-h-[80px]", className)}
                onBlur={onBlur}
              />
            ) : (
              <Input
                ref={(node) => {
                  internalInputRef.current = node as any;
                  if (typeof ref === 'function') ref(node);
                  else if (ref) (ref as React.MutableRefObject<any>).current = node;
                }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'Selecciona o escribe una dirección...'}
                disabled={disabled}
                className={cn("pr-8", className)}
                onBlur={onBlur}
              />
            )}
            <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-1 max-h-60 overflow-y-auto">
            {addresses.length > 0 ? (
              filteredAddresses.map((address) => (
                <Button
                  key={address.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-2 font-normal flex flex-col items-start text-left"
                  onClick={() => handleSelect(address)}
                >
                  <span className="font-semibold">{address.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {address.municipality}, {address.parish}
                  </span>
                </Button>
              ))
            ) : (
              <p className="p-2 text-center text-xs text-muted-foreground">
                No hay direcciones guardadas.
              </p>
            )}
            {addresses.length > 0 && filteredAddresses.length === 0 && (
              <p className="p-2 text-center text-xs text-muted-foreground">
                No se encontraron coincidencias.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
AddressInput.displayName = 'AddressInput';
