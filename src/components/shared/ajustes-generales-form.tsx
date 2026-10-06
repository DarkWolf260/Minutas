'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TAG_OPTIONS: Record<string, { label: string; value: string }[]> = {
  Estado: [
    { label: 'Anzoátegui', value: 'Anzoátegui' },
    { label: 'Nueva Esparta', value: 'Nueva Esparta' },
  ],
  ZOEDAN: [
    { label: 'Anzoátegui', value: 'Anzoátegui' },
    { label: 'Nueva Esparta', value: 'Nueva Esparta' },
  ],
  REDAN: [
    { label: 'Oriente', value: 'Oriente' },
    { label: 'Marítima Insular', value: 'Marítima Insular' },
  ],
  Municipio: [
    { label: 'Urbaneja', value: 'Urbaneja' },
    { label: 'Guanta', value: 'Guanta' },
    { label: 'Juan Antonio Sotillo', value: 'Juan Antonio Sotillo' },
    { label: '(Ninguno)', value: '' },
  ],
};

const CENTINELA_NINGUNO = '__none__';

interface AjustesGeneralesFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  definitions: any;
  fieldKeys: string[];
  columns?: 1 | 2;
  disabled?: boolean;
}

export function AjustesGeneralesForm({ 
  values, 
  onChange, 
  definitions, 
  fieldKeys,
  columns = 2,
  disabled = false 
}: AjustesGeneralesFormProps) {
  const esNuevaEsparta = (values['Estado'] || '').trim().toLowerCase() === 'nueva esparta';

  const handleFieldChange = (key: string, val: string) => {
    if (key === 'Estado') {
      onChange('Estado', val);
      if (val === 'Nueva Esparta') {
        onChange('ZOEDAN', 'Nueva Esparta');
        onChange('REDAN', 'Marítima Insular');
        if (['Guanta', 'Juan Antonio Sotillo', 'Urbaneja'].includes(values['Municipio'] || '')) {
          onChange('Municipio', '');
        }
      } else if (val === 'Anzoátegui') {
        onChange('ZOEDAN', 'Anzoátegui');
        onChange('REDAN', 'Oriente');
        if (!values['Municipio']) {
          onChange('Municipio', 'Urbaneja');
        }
      }
      return;
    }

    onChange(key, val);
  };

  const getOptionsForKey = (key: string) => {
    if (key === 'Municipio') {
      if (esNuevaEsparta) return null; // Campo de texto libre para Nueva Esparta
      const base = TAG_OPTIONS.Municipio!;
      const currentVal = values['Municipio'];
      if (currentVal && !base.some(b => b.value === currentVal)) {
        return [{ label: currentVal, value: currentVal }, ...base];
      }
      return base;
    }
    return TAG_OPTIONS[key] || null;
  };

  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-x-8 gap-y-4`}>
      {fieldKeys.map((key) => {
        const config = definitions[key];
        if (!config) return null;
        
        const options = getOptionsForKey(key);
        
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {config.label}
            </Label>
            
            {options ? (
              <Select 
                value={(values[key] === '' || !values[key]) ? CENTINELA_NINGUNO : values[key]} 
                onValueChange={(val) => handleFieldChange(key, val === CENTINELA_NINGUNO ? '' : val)}
                disabled={disabled}
              >
                <SelectTrigger id={key} className="bg-background w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value === '' ? CENTINELA_NINGUNO : opt.value}>
                      {opt.label || '(Ninguno)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={key}
                value={values[key] || ''}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={key === 'Municipio' && esNuevaEsparta ? 'Escribe el municipio (ej. Maneiro, Mariño...)' : undefined}
                className="bg-background w-full"
                disabled={disabled || key === 'Hora' || key === 'Fecha'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
