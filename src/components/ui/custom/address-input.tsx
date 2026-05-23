'use client';

import React, { useState, useMemo, useRef, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAddresses } from '@/hooks/use-addresses';
import type { Address } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, normalizeString } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onTypeChange?: (type: string) => void;
  typeValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
  isTextarea?: boolean;
  name?: string;
  id?: string;
}

const LOCATION_TYPES = [
  { value: 'centro_asistencial', label: 'Centro Asistencial' },
  { value: 'residencia', label: 'Residencia' },
  { value: 'lugar_publico', label: 'Lugar Público' },
  { value: 'institucion_comercio', label: 'Institución / Comercio' },
  { value: 'sede', label: 'Sede' },
] as const;

const LOCATION_TYPE_BADGE: Record<string, string> = {
  centro_asistencial: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
  residencia: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25',
  lugar_publico: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
  institucion_comercio: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25',
  sede: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
};

export const formatAddressToString = (address: Address): string => {
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
  ({ value, onChange, onTypeChange, typeValue, placeholder, disabled, className, onBlur, isTextarea, name, id }, ref) => {
    const { addresses, isLoaded } = useAddresses();
    const [open, setOpen] = useState(false);
    const internalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    // Detect if current value matches an address in the directory
    const matchedAddress = useMemo(() => {
      if (!value) return null;
      const normalized = normalizeString(value);
      return addresses.find(addr => normalizeString(formatAddressToString(addr)) === normalized) ?? null;
    }, [value, addresses]);

    const resolvedType = matchedAddress?.locationType ?? null;
    const isManual = !!value && !matchedAddress;

    // When a directory address is selected, auto-emit its locationType
    useEffect(() => {
      if (matchedAddress?.locationType && onTypeChange) {
        onTypeChange(matchedAddress.locationType);
      }
    }, [matchedAddress, onTypeChange]);

    const filteredAddresses = useMemo(() => {
      if (!value) return addresses;
      const normalizedValue = normalizeString(value);

      const isAFormattedAddress = addresses.some(
        (addr) => normalizeString(formatAddressToString(addr)) === normalizedValue
      );
      if (isAFormattedAddress) {
        return addresses;
      }

      return addresses.filter((address) =>
        normalizeString(formatAddressToString(address)).includes(normalizedValue)
      );
    }, [addresses, value]);

    const handleSelect = (address: Address) => {
      const formattedAddress = formatAddressToString(address);
      onChange(formattedAddress);
      if (onTypeChange && address.locationType) {
        onTypeChange(address.locationType);
      }
      setOpen(false);
      internalInputRef.current?.blur();
    };

    if (!isLoaded) {
      return <Skeleton className="h-10 w-full" />;
    }

    return (
      <div className="flex flex-col gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            <div className="relative">
              {isTextarea ? (
                <Textarea
                  ref={(node: HTMLTextAreaElement | null) => {
                    internalInputRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                  }}
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                  placeholder={placeholder || 'Selecciona o escribe una dirección...'}
                  disabled={disabled}
                  className={cn("pr-8 min-h-[80px]", className)}
                  onBlur={onBlur}
                  name={name}
                  id={id}
                />
              ) : (
                <Input
                  ref={(node: HTMLInputElement | null) => {
                    internalInputRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                  }}
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                  placeholder={placeholder || 'Selecciona o escribe una dirección...'}
                  disabled={disabled}
                  className={cn("pr-8", className)}
                  onBlur={onBlur}
                  name={name}
                  id={id}
                />
              )}
              <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <ScrollArea className="max-h-60 w-full" type="always">
              <div className="p-1">
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
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Badge informativo cuando coincide con el directorio */}
        {resolvedType && LOCATION_TYPE_BADGE[resolvedType] && (
          <span className={cn(
            'inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200',
            LOCATION_TYPE_BADGE[resolvedType]
          )}>
            {LOCATION_TYPES.find(t => t.value === resolvedType)?.label ?? resolvedType}
          </span>
        )}

        {/* Selector manual cuando la dirección NO coincide con el directorio */}
        {isManual && onTypeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide shrink-0">
              Tipo de lugar:
            </span>
            <Select value={typeValue ?? ''} onValueChange={onTypeChange} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs rounded-lg border-dashed flex-1">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }
);
AddressInput.displayName = 'AddressInput';
