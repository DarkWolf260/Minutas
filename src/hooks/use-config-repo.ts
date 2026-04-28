'use client';

import { useMemo } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { createConfigRepository } from '@/lib/repositories';

export function useConfigRepo() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();

  return useMemo(() => {
    if (!db || !currentWorkspace) return null;
    return createConfigRepository(db, currentWorkspace);
  }, [db, currentWorkspace]);
}
