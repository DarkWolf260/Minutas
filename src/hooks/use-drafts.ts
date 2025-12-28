
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { ReportDraft } from '@/types';

const DRAFT_STORAGE_KEY = 'app-report-draft';

export function useDrafts() {
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (storedDraft) {
        setDraft(JSON.parse(storedDraft));
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveDraft = useCallback((newDraft: ReportDraft) => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDraft));
      setDraft(newDraft);
    } catch (error) {
      console.error('Failed to save draft to localStorage', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        toast.error('No hay espacio para guardar el borrador.');
      }
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(null);
    } catch (error) {
      console.error('Failed to clear draft from localStorage', error);
    }
  }, []);

  return { draft, saveDraft, clearDraft, isLoaded };
}
