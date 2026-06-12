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
        const dbAddresses = data.map((item: any) => {
          const rawData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          return { ...(rawData as Address), workspace_id: currentWorkspace };
        });

        // Extract custom user-added addresses (IDs not starting with 'default_')
        const customAddresses = dbAddresses.filter((addr) => !addr.id.startsWith('default_'));

        // Extract default address overrides (IDs starting with 'default_' and not marked as deleted)
        const dbDefaultOverrides = dbAddresses.filter((addr) => addr.id.startsWith('default_') && !addr.isDeleted);

        // Identify deleted default addresses (IDs starting with 'default_' and marked as deleted)
        const deletedDefaultIds = new Set(
          dbAddresses.filter((addr) => addr.id.startsWith('default_') && addr.isDeleted).map((addr) => addr.id)
        );

        // Build the list of active default addresses:
        // - Exclude those that are logically deleted.
        // - Replace those that have custom overrides.
        const activeDefaults = (DEFAULT_ADDRESSES as Address[])
          .filter((addr) => !deletedDefaultIds.has(addr.id))
          .map((addr) => {
            const override = dbDefaultOverrides.find((o) => o.id === addr.id);
            return override ? override : addr;
          });

        // Combine the default and custom addresses
        setAddresses([...activeDefaults, ...customAddresses]);
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

