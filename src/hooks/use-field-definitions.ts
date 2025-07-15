
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FieldConfig, StaffMember } from '@/types';
import { format } from 'date-fns';
import { useSettings } from './use-settings';
import { useGuards } from './use-guards';

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
    'Reporta': { label: 'Reporta', type: 'predefined', value: '', sectionId: 'default'},
    'Analista': { label: 'Analista', type: 'predefined', value: '', sectionId: 'default'},
};

export function useFieldDefinitions() {
  const [definitions, setDefinitions] = useState<Record<string, FieldConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { guards, isLoaded: guardsLoaded } = useGuards();

  useEffect(() => {
    let isMounted = true;
    const loadDefinitions = () => {
        try {
            const stored = localStorage.getItem(DEFINITIONS_STORAGE_KEY);
            const existingDefinitions = stored ? JSON.parse(stored) : {};
            
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
            
            if (isMounted) {
                setDefinitions(merged);
            }

        } catch (error) {
            console.error('Failed to load global field definitions', error);
            const dynamicDefaults = {...defaultDefinitions};
            dynamicDefaults['Fecha'].value = format(new Date(), 'yyyy-MM-dd');
            if (isMounted) {
                setDefinitions(dynamicDefaults);
            }
        } finally {
            if (isMounted) {
                setIsLoaded(true);
            }
        }
    }

    if(settingsLoaded && guardsLoaded) {
        loadDefinitions();
    }
    
    return () => { isMounted = false };

  }, [settings, guards, settingsLoaded, guardsLoaded]);

  const saveDefinitions = useCallback((newDefinitions: Record<string, FieldConfig>) => {
    try {
      // Order is preserved by the component.
      localStorage.setItem(DEFINITIONS_STORAGE_KEY, JSON.stringify(newDefinitions));
      setDefinitions(newDefinitions);
    } catch (error) {
      console.error('Failed to save global field definitions', error);
    }
  }, []);

  const updateDefinition = useCallback((fieldName: string, newConfig: FieldConfig) => {
    const newDefinitions = { ...definitions, [fieldName]: newConfig };
    saveDefinitions(newDefinitions);
  }, [definitions, saveDefinitions]);

  const removeDefinition = useCallback((fieldName: string) => {
    const newDefinitions = { ...definitions };
    delete newDefinitions[fieldName];
    saveDefinitions(newDefinitions);
  }, [definitions, saveDefinitions]);

  const clearAllDefinitions = useCallback(() => {
    try {
      localStorage.removeItem(DEFINITIONS_STORAGE_KEY);
      setDefinitions(defaultDefinitions);
    } catch (error) {
      console.error('Failed to clear global field definitions', error);
    }
  }, []);

  return { definitions, updateDefinition, removeDefinition, saveDefinitions, isLoaded, clearAllDefinitions };
}
