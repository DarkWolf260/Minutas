'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

export function useUnits() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [units, setUnits] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.configs
      .find({
        selector: { 
          type: 'unit',
          workspaceId: currentWorkspace
        },
      })
      .$.subscribe((data) => {
        setUnits(data.map((d) => d.toJSON().name || ''));
        setIsLoaded(true);
      });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveUnits = useCallback(
    async (newUnits: string[]) => {
      if (!db || !currentWorkspace) return;
      try {
        const allDocs = await db.configs.find({ selector: { type: 'unit', workspaceId: currentWorkspace } }).exec();
        await db.configs.bulkRemove(allDocs.map((d) => d.primary));
        if (newUnits.length > 0) {
          const toInsert = newUnits.map((name) => ({
            id: `${currentWorkspace}:unit:${name}`,
            workspaceId: currentWorkspace,
            type: 'unit' as const,
            name,
            data: name,
          }));
          await db.configs.bulkInsert(toInsert as any);
        }
      } catch (error) {
        logger.error('Failed to save units', error, { feature: 'Units', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllUnits = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.configs.find({ selector: { type: 'unit', workspaceId: currentWorkspace } }).exec();
      await db.configs.bulkRemove(allDocs.map((d) => d.primary));
    } catch (error) {
      logger.error('Failed to clear units', error, { feature: 'Units', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { units, saveUnits, isLoaded, clearAllUnits };
}
