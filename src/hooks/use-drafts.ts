'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReportDraft } from '@/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

export function useDrafts() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.configs.findOne(`${currentWorkspace}:draft:active-draft`).$.subscribe((doc) => {
      if (doc) {
        setDraft(doc.toJSON().data as ReportDraft);
      } else {
        setDraft(null);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveDraft = useCallback(
    async (newDraft: ReportDraft) => {
      if (!db || !currentWorkspace) return;
      try {
        await db.configs.upsert({
          id: `${currentWorkspace}:draft:active-draft`,
          workspaceId: currentWorkspace,
          type: 'draft' as const,
          name: 'active-draft',
          data: {
            ...newDraft,
            workspaceId: currentWorkspace,
            lastSaved: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Failed to save draft', error, { feature: 'Drafts', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const clearDraft = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const doc = await db.configs.findOne(`${currentWorkspace}:draft:active-draft`).exec();
      if (doc) await doc.remove();
    } catch (error) {
      logger.error('Failed to clear draft', error, { feature: 'Drafts', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { draft, saveDraft, clearDraft, isLoaded };
}
