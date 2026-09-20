'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReportDraft } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { createConfigRepository } from '@/lib/repositories';

export function useDrafts() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace);

    const sub = repo.watchDraft().subscribe((doc) => {
      setDraft(doc ? (doc.toJSON().data as ReportDraft) : null);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveDraft = useCallback(
    async (newDraft: ReportDraft) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.saveDraft(newDraft);
    },
    [db, currentWorkspace]
  );

  const clearDraft = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace);
    await repo.clearDraft();
  }, [db, currentWorkspace]);

  return { draft, saveDraft, clearDraft, isLoaded };
}
