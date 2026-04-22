'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { DEFAULT_ADDRESSES } from '@/lib/constants/addresses';
import { logger } from '@/lib/logger';
import { createLookupRepository } from '@/lib/repositories';

export function useAddresses() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createLookupRepository(db, currentWorkspace);

    const sub = repo.watchAddresses().subscribe((data) => {
      if (data.length > 0) {
        setAddresses(
          data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as Address), workspaceId: currentWorkspace };
          }) as Address[]
        );
      } else {
        repo.bulkInitAddresses(DEFAULT_ADDRESSES).catch((err) => {
          const isConflict = (err as any).code === 'CONFLICT' || (err as any).status === 409;
          if (!isConflict) {
            logger.error('Failed to insert default addresses', err, {
              feature: 'Addresses',
              workspaceId: currentWorkspace,
            });
          }
        });
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const addAddress = useCallback(
    async (newAddress: Address) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.addAddress(newAddress);
    },
    [db, currentWorkspace]
  );

  const updateAddress = useCallback(
    async (updatedAddress: Address) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.updateAddress(updatedAddress);
    },
    [db, currentWorkspace]
  );

  const removeAddress = useCallback(
    async (addressId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.removeAddress(addressId);
    },
    [db, currentWorkspace]
  );

  const clearAllAddresses = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace);
    await repo.clearAllAddresses();
  }, [db, currentWorkspace]);

  return { addresses, addAddress, updateAddress, removeAddress, clearAllAddresses, isLoaded };
}
