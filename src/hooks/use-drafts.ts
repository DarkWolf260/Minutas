
'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { ReportDraft } from '@/types';
import { useLocalStorage } from './use-local-storage';

const DRAFT_STORAGE_KEY = 'app-report-draft';

export function useDrafts() {
  const [draft, setDraft, isLoaded] = useLocalStorage<ReportDraft | null>(
    DRAFT_STORAGE_KEY,
    null,
    {
      onError: (error, operation) => {
        console.error(`Failed to ${operation} draft:`, error);
        if (operation === 'save' && error instanceof Error && error.name === 'QuotaExceededError') {
          toast.error('No hay espacio para guardar el borrador.');
        }
      }
    }
  );

  const saveDraft = useCallback((newDraft: ReportDraft) => {
    setDraft(newDraft);
  }, [setDraft]);

  const clearDraft = useCallback(() => {
    setDraft(null);
  }, [setDraft]);

  return { draft, saveDraft, clearDraft, isLoaded };
}
