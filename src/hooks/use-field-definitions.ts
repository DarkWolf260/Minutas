'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FieldConfig } from '@/lib/types';
import { format } from 'date-fns';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';

const defaultDefinitions: Record<string, FieldConfig> = {
  Municipio: { label: 'Municipio', type: 'predefined', value: '', sectionId: 'default' },
  Estado: { label: 'Estado', type: 'predefined', value: 'Anzoátegui', sectionId: 'default' },
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

  const [definitions, setDefinitions] = useState<Record<string, FieldConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace);

    const sub = repo.watchFieldDefinitions().subscribe((data) => {
      if (data.length > 0) {
        const defMap: Record<string, FieldConfig> = {};
        data.forEach((d) => {
          const item = d.toJSON();
          defMap[item.name || ''] = {
            ...(item.data as FieldConfig),
            workspaceId: currentWorkspace,
          };
        });

        if (defMap['Fecha']) {
          defMap['Fecha'] = {
            ...defMap['Fecha'],
            value: format(new Date(), 'yyyy-MM-dd'),
          };
        }

        setDefinitions(defMap);
      } else {
        repo
          .bulkInitFieldDefinitions(defaultDefinitions)
          .catch((err) =>
            logger.error('Failed to insert default field definitions', err, {
              feature: 'FieldDefinitions',
              workspaceId: currentWorkspace,
            })
          );
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveDefinitions = useCallback(
    async (newDefinitions: Record<string, FieldConfig>) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.saveAllFieldDefinitions(newDefinitions);
    },
    [db, currentWorkspace]
  );

  const updateDefinition = useCallback(
    async (fieldName: string, newConfig: FieldConfig) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.upsertFieldDefinition(fieldName, newConfig);
    },
    [db, currentWorkspace]
  );

  const removeDefinition = useCallback(
    async (fieldName: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.removeFieldDefinition(fieldName);
    },
    [db, currentWorkspace]
  );

  const clearAllDefinitions = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace);
    await repo.clearAllFieldDefinitions(defaultDefinitions);
  }, [db, currentWorkspace]);

  return useMemo(
    () => ({
      definitions,
      updateDefinition,
      removeDefinition,
      saveDefinitions,
      isLoaded,
      clearAllDefinitions,
    }),
    [
      definitions,
      updateDefinition,
      removeDefinition,
      saveDefinitions,
      isLoaded,
      clearAllDefinitions,
    ]
  );
}
