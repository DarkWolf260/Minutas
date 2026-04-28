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

export const TAG_OPTIONS: Record<string, { label: string; value: string }[]> = {
  Estado: [{ label: 'Anzoátegui', value: 'Anzoátegui' }],
  ZOEDAN: [{ label: 'Anzoátegui', value: 'Anzoátegui' }],
  REDAN: [{ label: 'Oriente', value: 'Oriente' }],
  Municipio: [
    { label: '(Ninguno)', value: '' },
    { label: 'Guanta', value: 'Guanta' },
    { label: 'Juan Antonio Sotillo', value: 'Juan Antonio Sotillo' },
    { label: 'Urbaneja', value: 'Urbaneja' },
  ],
};

const CENTINELA_NINGUNO = '__none__';

interface AjustesGeneralesFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  definitions: any;
  fieldKeys: string[];
  columns?: 1 | 2;
}

export function AjustesGeneralesForm({ 
  values, 
  onChange, 
  definitions, 
  fieldKeys,
  columns = 2 
}: AjustesGeneralesFormProps) {
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-x-8 gap-y-4`}>
      {fieldKeys.map((key) => {
        const config = definitions[key];
        if (!config) return null;
        
        const options = TAG_OPTIONS[key];
        
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {config.label}
            </Label>
            
            {options ? (
              <Select 
                value={(values[key] === '' || !values[key]) ? CENTINELA_NINGUNO : values[key]} 
                onValueChange={(val) => onChange(key, val === CENTINELA_NINGUNO ? '' : val)}
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
                onChange={(e) => onChange(key, e.target.value)}
                className="bg-background w-full"
                disabled={key === 'Hora' || key === 'Fecha'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
