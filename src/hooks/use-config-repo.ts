'use client';

import { useMemo } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { createConfigRepository } from '@/lib/repositories';

export function useConfigRepo() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();

  return useMemo(() => {
    if (!currentWorkspace) return null;
    return createConfigRepository(db, currentWorkspace, isCloud);
  }, [db, currentWorkspace, isCloud]);
}
