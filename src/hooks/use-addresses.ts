'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { DEFAULT_ADDRESSES } from '@/lib/constants/addresses';
import { logger } from '@/lib/logger';
import { createLookupRepository } from '@/lib/repositories';

export function useAddresses() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createLookupRepository(db, currentWorkspace, isCloud);

    const sub = repo.watchAddresses().subscribe({
      next: (data) => {
        if (data.length > 0) {
          setAddresses(
            data.map((item: any) => {
              const rawData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              return { ...(rawData as Address), workspace_id: currentWorkspace };
            })
          );
        } else {
          // Just use defaults in state, do NOT init in DB to avoid cloud conflicts
          setAddresses(DEFAULT_ADDRESSES as Address[]);
        }
        setIsLoaded(true);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const addAddress = useCallback(
    async (newAddress: Address) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.addAddress(newAddress);
    },
    [db, currentWorkspace, isCloud]
  );

  const updateAddress = useCallback(
    async (updatedAddress: Address) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.updateAddress(updatedAddress);
    },
    [db, currentWorkspace, isCloud]
  );

  const removeAddress = useCallback(
    async (addressId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.removeAddress(addressId);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllAddresses = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    await repo.clearAllAddresses();
  }, [db, currentWorkspace, isCloud]);

  return { addresses, addAddress, updateAddress, removeAddress, clearAllAddresses, isLoaded };
}

