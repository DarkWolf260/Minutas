
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FieldConfig } from '@/types';
import { format } from 'date-fns';

const DEFINITIONS_STORAGE_KEY = 'app-global-field-configs';

const defaultDefinitions: Record<string, FieldConfig> = {
    'Municipio': { label: 'Municipio', type: 'predefined', value: '', sectionId: 'default' },
    'Estado': { label: 'Estado', type: 'predefined', value: '', sectionId: 'default' },
    'Director': { label: 'Director', type: 'predefined', value: '', sectionId: 'default' },
    'Jefe de Operaciones': { label: 'Jefe de Operaciones', type: 'predefined', value: '', sectionId: 'default' },
    'REDAN': { label: 'REDAN', type: 'predefined', value: '', sectionId: 'default' },
    'ZOEDAN': { label: 'ZOEDAN', type: 'predefined', value: '', sectionId: 'default' },
    'Fecha': { label: 'Fecha', type: 'date', value: format(new Date(), 'yyyy-MM-dd'), sectionId: 'default' },
    'Hora': { label: 'Hora', type: 'time-hlv', value: '', sectionId: 'default' },
    'Ubicación': { label: 'Ubicación', type: 'textarea', value: '', sectionId: 'default' },
    'Destino': { label: 'Destino', type: 'textarea', value: '', sectionId: 'default' },
    'Descripción de la novedad': { label: 'Descripción de la novedad', type: 'textarea', value: '', sectionId: 'default' },
    'Conclusión de la novedad': { label: 'Conclusión de la novedad', type: 'textarea', value: '', sectionId: 'default' },
};

export function useFieldDefinitions() {
  const [definitions, setDefinitions] = useState<Record<string, FieldConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEFINITIONS_STORAGE_KEY);
      const existingDefinitions = stored ? JSON.parse(stored) : {};
      
      const merged = { ...defaultDefinitions, ...existingDefinitions };

      // Migrate old definitions by adding a sectionId
      Object.keys(merged).forEach(key => {
        if (!merged[key].sectionId) {
          merged[key].sectionId = defaultDefinitions[key] ? 'default' : 'unassigned';
        }
      });
      
      setDefinitions(merged);
    } catch (error) {
      console.error('Failed to load global field definitions', error);
      setDefinitions(defaultDefinitions);
    } finally {
        setIsLoaded(true);
    }
  }, []);

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
