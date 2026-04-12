'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FieldConfig } from '@/lib/types';
import { format } from 'date-fns';
import { useSettings } from './use-settings';
import { useGuards } from './use-guards';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

const defaultDefinitions: Record<string, FieldConfig> = {
  Municipio: { label: 'Municipio', type: 'predefined', value: '', sectionId: 'default' },
  Estado: { label: 'Estado', type: 'predefined', value: 'Anzoátegui', sectionId: 'default' },
  Director: { label: 'Director', type: 'predefined', value: '', sectionId: 'default' },
  'Jefe de Operaciones': {
    label: 'Jefe de Operaciones',
    type: 'predefined',
    value: '',
    sectionId: 'default',
  },
  REDAN: { label: 'REDAN', type: 'predefined', value: 'Oriente', sectionId: 'default' },
  ZOEDAN: { label: 'ZOEDAN', type: 'predefined', value: 'Anzoátegui', sectionId: 'default' },
  Fecha: {
    label: 'Fecha',
    type: 'date',
    value: format(new Date(), 'yyyy-MM-dd'),
    sectionId: 'default',
  },
  Hora: { label: 'Hora', type: 'time-hlv', value: '', sectionId: 'default' },
  Reporta: { label: 'Reporta', type: 'predefined', value: '', sectionId: 'default' },
  Analista: { label: 'Analista', type: 'predefined', value: '', sectionId: 'default' },
};

export function useFieldDefinitions() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const { isLoaded: settingsLoaded } = useSettings();
  const { isLoaded: guardsLoaded } = useGuards();

  const [definitions, setDefinitions] = useState<Record<string, FieldConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.configs
      .find({
        selector: { 
          type: 'field_definition',
          workspaceId: currentWorkspace
        },
      })
      .$.subscribe((data) => {
        if (data.length > 0) {
          const defMap: Record<string, FieldConfig> = {};
          data.forEach((d) => {
            const item = d.toJSON();
            defMap[item.name || ''] = { ...(item.data as FieldConfig), workspaceId: currentWorkspace };
          });

          // Dynamic date update for 'Fecha' if it exists
          if (defMap['Fecha']) {
            defMap['Fecha'] = {
              ...defMap['Fecha'],
              value: format(new Date(), 'yyyy-MM-dd'),
            };
          }

          setDefinitions(defMap);
        } else {
          // Initial insert for this workspace
          const entries = Object.entries(defaultDefinitions).map(([name, config]) => ({
            id: `${currentWorkspace}:field_definition:${name}`,
            workspaceId: currentWorkspace,
            type: 'field_definition' as const,
            name,
            data: { ...config, workspaceId: currentWorkspace },
          }));
          db.configs
            .bulkInsert(entries as any)
            .catch((err) =>
              logger.error('Failed to insert default field definitions', err, { feature: 'FieldDefinitions', workspaceId: currentWorkspace })
            );
        }
        setIsLoaded(true);
      });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveDefinitions = useCallback(
    async (newDefinitions: Record<string, FieldConfig>) => {
      if (!db || !currentWorkspace) return;
      try {
        const allDocs = await db.configs.find({ selector: { type: 'field_definition', workspaceId: currentWorkspace } }).exec();
        const newIds = new Set(Object.keys(newDefinitions));
        const toDelete = allDocs.filter((d) => !newIds.has(d.toJSON().name || ''));
        if (toDelete.length > 0) {
          await db.configs.bulkRemove(toDelete.map((d) => d.primary));
        }

        const entries = Object.entries(newDefinitions).map(([name, config]) => ({
          id: `${currentWorkspace}:field_definition:${name}`,
          workspaceId: currentWorkspace,
          type: 'field_definition' as const,
          name,
          data: { ...config, workspaceId: currentWorkspace },
        }));
        await db.configs.bulkUpsert(entries as any);
      } catch (error) {
        logger.error('Failed to save field definitions', error, { feature: 'FieldDefinitions', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const updateDefinition = useCallback(
    async (fieldName: string, newConfig: FieldConfig) => {
      if (!db || !currentWorkspace) return;
      try {
        await db.configs.upsert({
          id: `${currentWorkspace}:field_definition:${fieldName}`,
          workspaceId: currentWorkspace,
          type: 'field_definition',
          name: fieldName,
          data: { ...newConfig, workspaceId: currentWorkspace },
        } as any);
      } catch (error) {
        logger.error('Failed to update field definition', error, { feature: 'FieldDefinitions', workspaceId: currentWorkspace, metadata: { fieldName } });
      }
    },
    [db, currentWorkspace]
  );

  const removeDefinition = useCallback(
    async (fieldName: string) => {
      if (!db || !currentWorkspace) return;
      try {
        const doc = await db.configs.findOne(`${currentWorkspace}:field_definition:${fieldName}`).exec();
        if (doc) await doc.remove();
      } catch (error) {
        logger.error('Failed to remove field definition', error, { feature: 'FieldDefinitions', workspaceId: currentWorkspace, metadata: { fieldName } });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllDefinitions = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.configs.find({ selector: { type: 'field_definition', workspaceId: currentWorkspace } }).exec();
      await db.configs.bulkRemove(allDocs.map((d) => d.primary));
      
      const entries = Object.entries(defaultDefinitions).map(([name, config]) => ({
        id: `${currentWorkspace}:field_definition:${name}`,
        workspaceId: currentWorkspace,
        type: 'field_definition' as const,
        name,
        data: { ...config, workspaceId: currentWorkspace },
      }));
      await db.configs.bulkInsert(entries as any);
    } catch (error) {
      logger.error('Failed to clear field definitions', error, { feature: 'FieldDefinitions', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return useMemo(() => ({
    definitions,
    updateDefinition,
    removeDefinition,
    saveDefinitions,
    isLoaded: isLoaded && settingsLoaded && guardsLoaded,
    clearAllDefinitions,
  }), [definitions, updateDefinition, removeDefinition, saveDefinitions, isLoaded, settingsLoaded, guardsLoaded, clearAllDefinitions]);
}
