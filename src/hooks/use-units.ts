'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';

export function useUnits() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [units, setUnits] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace, isCloud);
    const sub = repo.watchUnits().subscribe((data: any[]) => {
      setUnits(data.map((d: any) => {
        const item = d.toJSON ? d.toJSON() : d;
        return item.name || '';
      }));
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveUnits = useCallback(
    async (newUnits: string[]) => {
      if (!currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace, isCloud);
      await repo.saveUnits(newUnits);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllUnits = useCallback(async () => {
    if (!currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace, isCloud);
    await repo.clearAllUnits();
  }, [db, currentWorkspace, isCloud]);

  return { units, saveUnits, isLoaded, clearAllUnits };
}

