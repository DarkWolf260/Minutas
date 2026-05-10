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
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initialized = false;

    const repo = createConfigRepository(db, currentWorkspace, isCloud);
    const sub = repo.watchGuards().subscribe((data) => {
      if (data.length > 0) {
        setGuards(
          data.map((d) => {
            const item = d.toJSON ? d.toJSON() : d;
            const rawData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            const guardData = rawData as Guard;
            return { ...guardData, workspace_id: currentWorkspace };
          }) as Guard[]
        );
        initialized = true;
      } else if (!initialized) {
        initialized = true;
        setGuards(defaultGuards);
      } else {
        setGuards([]);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveGuards = useCallback(
    async (newGuards: Guard[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace, isCloud);
      await repo.saveGuards(newGuards);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllGuards = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace, isCloud);
    await repo.clearAllGuards(defaultGuards);
  }, [db, currentWorkspace, isCloud]);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}

