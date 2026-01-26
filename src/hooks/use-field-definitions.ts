'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FieldConfig } from '@/types';
import { format } from 'date-fns';
import { useSettings } from './use-settings';
import { useGuards } from './use-guards';
import { useDatabase } from '@/lib/db/db-provider';

const defaultDefinitions: Record<string, FieldConfig> = {
  'Municipio': { label: 'Municipio', type: 'predefined', value: '', sectionId: 'default' },
  'Estado': { label: 'Estado', type: 'predefined', value: '', sectionId: 'default' },
  'Director': { label: 'Director', type: 'predefined', value: '', sectionId: 'default' },
  'Jefe de Operaciones': { label: 'Jefe de Operaciones', type: 'predefined', value: '', sectionId: 'default' },
  'REDAN': { label: 'REDAN', type: 'predefined', value: '', sectionId: 'default' },
  'ZOEDAN': { label: 'ZOEDAN', type: 'predefined', value: '', sectionId: 'default' },
  'Fecha': { label: 'Fecha', type: 'date', value: format(new Date(), 'yyyy-MM-dd'), sectionId: 'default' },
  'Hora': { label: 'Hora', type: 'time-hlv', value: '', sectionId: 'default' },
  'Reporta': { label: 'Reporta', type: 'predefined', value: '', sectionId: 'default' },
  'Analista': { label: 'Analista', type: 'predefined', value: '', sectionId: 'default' },
};

export function useFieldDefinitions() {
  const db = useDatabase();
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { guards, isLoaded: guardsLoaded } = useGuards();

  const [definitions, setDefinitions] = useState<Record<string, FieldConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.field_definitions.find().$.subscribe(data => {
      if (data.length > 0) {
        const defMap: Record<string, FieldConfig> = {};
        data.forEach(d => {
          const item = d.toJSON();
          defMap[item.id] = item.config as FieldConfig;
        });

        // Dynamic date update for 'Fecha' if it exists
        if (defMap['Fecha']) {
          defMap['Fecha'] = {
            ...defMap['Fecha'],
            value: format(new Date(), 'yyyy-MM-dd')
          };
        }

        setDefinitions(defMap);
      } else {
        // Initial insert
        const entries = Object.entries(defaultDefinitions).map(([id, config]) => ({ id, config }));
        db.field_definitions.bulkInsert(entries).catch(err => console.error('Failed to insert default field definitions:', err));
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveDefinitions = useCallback(async (newDefinitions: Record<string, FieldConfig>) => {
    if (!db) return;
    try {
      const entries = Object.entries(newDefinitions).map(([id, config]) => ({ id, config }));
      const allDocs = await db.field_definitions.find().exec();
      const newIds = new Set(Object.keys(newDefinitions));
      const toDelete = allDocs.filter(d => !newIds.has(d.id));
      if (toDelete.length > 0) await Promise.all(toDelete.map(d => d.remove()));
      await db.field_definitions.bulkUpsert(entries);
    } catch (error) {
      console.error('Failed to save field definitions:', error);
    }
  }, [db]);

  const updateDefinition = useCallback(async (fieldName: string, newConfig: FieldConfig) => {
    if (!db) return;
    try {
      await db.field_definitions.upsert({ id: fieldName, config: newConfig });
    } catch (error) {
      console.error('Failed to update field definition:', error);
    }
  }, [db]);

  const removeDefinition = useCallback(async (fieldName: string) => {
    if (!db) return;
    try {
      const doc = await db.field_definitions.findOne(fieldName).exec();
      if (doc) await doc.remove();
    } catch (error) {
      console.error('Failed to remove field definition:', error);
    }
  }, [db]);

  const clearAllDefinitions = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.field_definitions.find().exec();
      await Promise.all(allDocs.map(d => d.remove()));
      const entries = Object.entries(defaultDefinitions).map(([id, config]) => ({ id, config }));
      await db.field_definitions.bulkInsert(entries);
    } catch (error) {
      console.error('Failed to clear field definitions:', error);
    }
  }, [db]);

  return { definitions, updateDefinition, removeDefinition, saveDefinitions, isLoaded: isLoaded && settingsLoaded && guardsLoaded, clearAllDefinitions };
}
