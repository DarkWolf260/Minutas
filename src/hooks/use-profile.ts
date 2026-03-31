'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

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

    const sub = db.configs.findOne(`${currentWorkspace}:profile:user`).$.subscribe(async (doc) => {
      if (doc) {
        setProfile(doc.toJSON().data as UserProfile);
      } else {
        // Safe insert
        try {
          await db.configs.insert({ 
            id: `${currentWorkspace}:profile:user`, 
            workspaceId: currentWorkspace,
            type: 'profile', 
            data: { ...defaultProfile, workspaceId: currentWorkspace }
          });
        } catch (err: unknown) {
          const e = err as any;
          const isConflict = e.code === 'CONFLICT' || e.status === 409;
          if (!isConflict) {
            logger.error('Failed to insert default profile', err, { feature: 'Profile', workspaceId: currentWorkspace });
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
      try {
        const doc = await db.configs.findOne(`${currentWorkspace}:profile:user`).exec();
        const currentData = doc ? doc.toJSON().data : defaultProfile;
        await db.configs.upsert({ 
          id: `${currentWorkspace}:profile:user`, 
          workspaceId: currentWorkspace,
          type: 'profile', 
          data: { ...currentData, ...newProfile, workspaceId: currentWorkspace } 
        });
      } catch (error) {
        logger.error('Failed to save profile', error, { feature: 'Profile', workspaceId: currentWorkspace });
        throw error; // Let the caller handle UI success/error states
      }
    },
    [db, currentWorkspace]
  );

  const clearProfile = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const doc = await db.configs.findOne(`${currentWorkspace}:profile:user`).exec();
      if (doc) await doc.remove();
      logger.info('User profile cleared', { workspaceId: currentWorkspace });
    } catch (error) {
      logger.error('Failed to clear profile', error, { feature: 'Profile', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { profile, saveProfile, clearProfile, isLoaded };
}
