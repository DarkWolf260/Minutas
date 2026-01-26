'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReportDraft } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';

export function useDrafts() {
  const db = useDatabase();
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.drafts.findOne('active-draft').$.subscribe(doc => {
      if (doc) {
        setDraft(doc.toJSON() as ReportDraft);
      } else {
        setDraft(null);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveDraft = useCallback(async (newDraft: ReportDraft) => {
    if (!db) return;
    try {
      await db.drafts.upsert({ ...newDraft, id: 'active-draft', lastSaved: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [db]);

  const clearDraft = useCallback(async () => {
    if (!db) return;
    try {
      const doc = await db.drafts.findOne('active-draft').exec();
      if (doc) await doc.remove();
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [db]);

  return { draft, saveDraft, clearDraft, isLoaded };
}
