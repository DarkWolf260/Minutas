'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { DatabaseContext } from '@/lib/db/db-context';
import { createConfigRepository } from '@/lib/repositories/config.repository';
import { stableStringify } from '@/lib/utils-pure';
import { logger } from '@/lib/logger';
import type { Staff, ManualNovedad } from '@/lib/types';

export interface OrdenDelDiaDraft {
  staff: Staff;
  activities: ManualNovedad[];
  notes: { id: string; content: string }[];
  es_jefe_encargado?: boolean;
  guard_id: string;
  updated_at: string;
}

export function useOrdenDelDiaDraft() {
  const context = useContext(DatabaseContext);
  
  if (!context) {
    return { draft: null, saveDraft: async () => {}, isLoaded: false };
  }
  
  const { db, currentWorkspace, isCloud } = context;
  const [draft, setDraft] = useState<OrdenDelDiaDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const repository = useRef(
    db ? createConfigRepository(db, currentWorkspace, isCloud) : null
  );

  // Sync repository if db or workspace changes
  useEffect(() => {
    if (db && currentWorkspace) {
      repository.current = createConfigRepository(db, currentWorkspace, isCloud);
    }
  }, [db, currentWorkspace, isCloud]);

  // Watch for changes in the dedicated draft document
  useEffect(() => {
    if (!repository.current) return;

    const sub = repository.current.watchOrdenDelDia().subscribe(doc => {
      const data = doc?.toJSON().data as OrdenDelDiaDraft;
      if (data) {
        setDraft(prev => {
          if (stableStringify(prev) === stableStringify(data)) return prev;
          return data;
        });
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [currentWorkspace]);

  const saveDraft = async (newDraft: Partial<OrdenDelDiaDraft>) => {
    if (!repository.current) return;
    
    // Get current state to merge
    const current = draft || { 
      staff: {}, 
      activities: [], 
      notes: [], 
      guard_id: '',
      updated_at: new Date().toISOString() 
    };

    const merged = { ...current, ...newDraft };
    
    // Prevent useless saves
    if (stableStringify(current) === stableStringify(merged)) return;

    return repository.current.saveOrdenDelDia(merged);
  };

  return {
    draft,
    saveDraft,
    isLoaded
  };
}
