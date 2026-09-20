'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FieldConfig } from '@/lib/types';
import { format } from 'date-fns';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { useConfigRepo } from './use-config-repo';

const defaultDefinitions: Record<string, FieldConfig> = {
  Municipio: { label: 'Municipio', type: 'predefined', value: '', section_id: 'default' },
  Estado: { label: 'Estado', type: 'predefined', value: 'Anzoátegui', section_id: 'default' },
  REDAN: { label: 'REDAN', type: 'predefined', value: 'Oriente', section_id: 'default' },
  ZOEDAN: { label: 'ZOEDAN', type: 'predefined', value: 'Anzoátegui', section_id: 'default' },
  Fecha: {
    label: 'Fecha',
    type: 'date',
    value: format(new Date(), 'yyyy-MM-dd'),
    section_id: 'default',
  },
  Hora: { label: 'Hora', type: 'time-hlv', value: '', section_id: 'default' },
  Reporta: { label: 'Reporta', type: 'predefined', value: '', section_id: 'default' },
  Analista: { label: 'Analista', type: 'predefined', value: '', section_id: 'default' },
};

export function useFieldDefinitions() {
  const repo = useConfigRepo();
  const { currentWorkspace } = useWorkspaceManager();

  const [definitions, setDefinitions] = useState<Record<string, FieldConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!repo || !currentWorkspace) return;

    const sub = repo.watchFieldDefinitions().subscribe((data) => {
      if (data.length > 0) {
        const defMap: Record<string, FieldConfig> = {};
        data.forEach((d) => {
          const item = d.toJSON ? d.toJSON() : d;
          defMap[item.name || ''] = {
            ...(item.data as FieldConfig),
            workspace_id: currentWorkspace,
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
        // Just use defaults in state, do NOT init in DB to avoid cloud sync conflicts
        setDefinitions(defaultDefinitions);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [repo, currentWorkspace]);

  const saveDefinitions = useCallback(
    async (newDefinitions: Record<string, FieldConfig>) => {
      if (!repo) return;
      await repo.saveAllFieldDefinitions(newDefinitions);
    },
    [repo]
  );

  const updateDefinition = useCallback(
    async (fieldName: string, newConfig: FieldConfig) => {
      if (!repo) return;
      await repo.upsertFieldDefinition(fieldName, newConfig);
    },
    [repo]
  );

  const removeDefinition = useCallback(
    async (fieldName: string) => {
      if (!repo) return;
      await repo.removeFieldDefinition(fieldName);
    },
    [repo]
  );

  const clearAllDefinitions = useCallback(async () => {
    if (!repo) return;
    await repo.clearAllFieldDefinitions(defaultDefinitions);
  }, [repo]);

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

