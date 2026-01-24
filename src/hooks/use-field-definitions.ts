
'use client';

import { useCallback } from 'react';
import type { FieldConfig } from '@/types';
import { format } from 'date-fns';
import { useSettings } from './use-settings';
import { useGuards } from './use-guards';
import { useLocalStorage } from './use-local-storage';

const DEFINITIONS_STORAGE_KEY = 'app-global-field-configs';

const defaultDefinitions: Record<string, FieldConfig> = {
  'Municipio': { label: 'Municipio', type: 'predefined', value: '', sectionId: 'default' },
  'Estado': { label: 'Estado', type: 'predefined', value: '', sectionId: 'default' },
  'Director': { label: 'Director', type: 'predefined', value: '', sectionId: 'default' },
  'Jefe de Operaciones': { label: 'Jefe de Operaciones', type: 'predefined', value: '', sectionId: 'default' },
  'REDAN': { label: 'REDAN', type: 'predefined', value: '', sectionId: 'default' },
  'ZOEDAN': { label: 'ZOEDAN', type: 'predefined', value: '', sectionId: 'default' },
  'Fecha': { label: 'Fecha', type: 'date', value: '', sectionId: 'default' }, // Value is now set dynamically
  'Hora': { label: 'Hora', type: 'time-hlv', value: '', sectionId: 'default' },
  'Reporta': { label: 'Reporta', type: 'predefined', value: '', sectionId: 'default' },
  'Analista': { label: 'Analista', type: 'predefined', value: '', sectionId: 'default' },
};

export function useFieldDefinitions() {
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { guards, isLoaded: guardsLoaded } = useGuards();

  const [definitions, setDefinitions, isLoaded] = useLocalStorage<Record<string, FieldConfig>>(
    DEFINITIONS_STORAGE_KEY,
    defaultDefinitions,
    {
      migrate: (existingDefinitions: any) => {
        let merged = { ...defaultDefinitions, ...existingDefinitions };

        // Migrate old definitions by adding a sectionId
        Object.keys(merged).forEach(key => {
          if (!merged[key].sectionId) {
            merged[key].sectionId = defaultDefinitions[key] ? 'default' : 'unassigned';
          }
        });

        // Dynamically set the current date for the 'Fecha' field.
        if (merged['Fecha']) {
          merged['Fecha'].value = format(new Date(), 'yyyy-MM-dd');
        }

        return merged;
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} field definitions:`, error);
      }
    }
  );

  const saveDefinitions = useCallback((newDefinitions: Record<string, FieldConfig>) => {
    setDefinitions(newDefinitions);
  }, [setDefinitions]);

  const updateDefinition = useCallback((fieldName: string, newConfig: FieldConfig) => {
    setDefinitions(prev => ({ ...prev, [fieldName]: newConfig }));
  }, [setDefinitions]);

  const removeDefinition = useCallback((fieldName: string) => {
    setDefinitions(prev => {
      const newDefinitions = { ...prev };
      delete newDefinitions[fieldName];
      return newDefinitions;
    });
  }, [setDefinitions]);

  const clearAllDefinitions = useCallback(() => {
    setDefinitions(defaultDefinitions);
  }, [setDefinitions]);

  return { definitions, updateDefinition, removeDefinition, saveDefinitions, isLoaded: isLoaded && settingsLoaded && guardsLoaded, clearAllDefinitions };
}
