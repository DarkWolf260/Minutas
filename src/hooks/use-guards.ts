/**
 * Hook for managing guard assignments with RxDB persistence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Guard } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';

const defaultGuards: Guard[] = [
  { id: 'A', staff: {} },
  { id: 'B', staff: {} },
  { id: 'C', staff: {} },
  { id: 'D', staff: {} },
];

export function useGuards() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initialized = false;

    const repo = createConfigRepository(db, currentWorkspace);
    const sub = repo.watchGuards().subscribe((data) => {
      if (data.length > 0) {
        setGuards(
          data.map((d) => {
            const guardData = d.toJSON().data as Guard;
            return { ...guardData, workspace_id: currentWorkspace };
          }) as Guard[]
        );
        initialized = true;
      } else if (!initialized) {
        initialized = true;
        // Just use defaults in state, do NOT init in DB to avoid cloud sync conflicts
        setGuards(defaultGuards);
      } else {
        setGuards([]);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveGuards = useCallback(
    async (newGuards: Guard[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.saveGuards(newGuards);
    },
    [db, currentWorkspace]
  );

  const clearAllGuards = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace);
    await repo.clearAllGuards(defaultGuards);
  }, [db, currentWorkspace]);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}

