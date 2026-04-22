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
  const { currentWorkspace } = useWorkspaceManager();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace);

    const sub = repo.watchProfile().subscribe(async (doc) => {
      if (doc) {
        setProfile(doc.toJSON().data as UserProfile);
      } else {
        try {
          await repo.initProfile(defaultProfile);
        } catch (err: unknown) {
          const e = err as any;
          const isConflict = e.code === 'CONFLICT' || e.status === 409;
          if (!isConflict) {
            logger.error('Failed to insert default profile', err, {
              feature: 'Profile',
              workspaceId: currentWorkspace,
            });
          }
        }
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveProfile = useCallback(
    async (newProfile: Partial<UserProfile>) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.saveProfile(profile, newProfile);
    },
    [db, currentWorkspace, profile]
  );

  const clearProfile = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace);
    await repo.clearProfile();
    logger.info('User profile cleared', { workspaceId: currentWorkspace });
  }, [db, currentWorkspace]);

  return { profile, saveProfile, clearProfile, isLoaded };
}
