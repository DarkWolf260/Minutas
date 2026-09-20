'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';

export interface UserProfile {
  name: string;
  cedula: string;
  rank: string;
  department: string;
  avatarUrl?: string;
  signature?: string;
}

const defaultProfile: UserProfile = {
  name: '',
  cedula: '',
  rank: '',
  department: '',
  avatarUrl: '',
  signature: '',
};

export function useProfile() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace, isCloud);

    const sub = repo.watchProfile().subscribe(async (doc) => {
      if (doc) {
        const item = doc.toJSON ? doc.toJSON() : doc;
        setProfile(item.data as UserProfile);
      } else {
        // Just use defaults in state, do NOT init in DB to avoid cloud sync conflicts
        setProfile(defaultProfile);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveProfile = useCallback(
    async (newProfile: Partial<UserProfile>) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace, isCloud);
      await repo.saveProfile(profile, newProfile);
    },
    [db, currentWorkspace, profile, isCloud]
  );

  const clearProfile = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace, isCloud);
    await repo.clearProfile();
    logger.info('User profile cleared', { workspace_id: currentWorkspace });
  }, [db, currentWorkspace, isCloud]);

  return { profile, saveProfile, clearProfile, isLoaded };
}

