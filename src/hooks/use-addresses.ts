'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address } from '@/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { DEFAULT_ADDRESSES } from '@/constants/addresses';
import { logger } from '@/lib/logger';

export function useAddresses() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.lookups
      .find({
        selector: { 
          type: 'address',
          workspaceId: currentWorkspace
        },
      })
      .$.subscribe((data) => {
        if (data.length > 0) {
          setAddresses(data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as Address), workspaceId: currentWorkspace };
          }) as Address[]);
        } else {
          // Initial addresses if DB is empty for this workspace
          const toInsert = DEFAULT_ADDRESSES.map((addr) => ({
            id: `${currentWorkspace}:addr:${addr.id}`,
            workspaceId: currentWorkspace,
            type: 'address' as const,
            name: addr.name,
            data: { ...addr, workspaceId: currentWorkspace },
          }));

          db.lookups.bulkInsert(toInsert as any).catch((err) => {
            const isConflict = err.code === 'CONFLICT' || err.status === 409;
            if (!isConflict) {
              logger.error('Failed to insert default addresses', err, { feature: 'Addresses', workspaceId: currentWorkspace });
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
      try {
        await db.lookups.insert({
          id: `${currentWorkspace}:addr:${newAddress.id}`,
          workspaceId: currentWorkspace,
          type: 'address',
          name: newAddress.name,
          data: { ...newAddress, workspaceId: currentWorkspace },
        });
      } catch (error) {
        logger.error('Failed to add address', error, { feature: 'Addresses', workspaceId: currentWorkspace, metadata: { addressId: newAddress.id } });
      }
    },
    [db, currentWorkspace]
  );

  const updateAddress = useCallback(
    async (updatedAddress: Address) => {
      if (!db || !currentWorkspace) return;
      try {
        const doc = await db.lookups.findOne(`${currentWorkspace}:addr:${updatedAddress.id}`).exec();
        if (doc) {
          await doc.patch({
            name: updatedAddress.name,
            data: { ...updatedAddress, workspaceId: currentWorkspace },
          });
        }
      } catch (error) {
        logger.error('Failed to update address', error, { feature: 'Addresses', workspaceId: currentWorkspace, metadata: { addressId: updatedAddress.id } });
      }
    },
    [db, currentWorkspace]
  );

  const removeAddress = useCallback(
    async (addressId: string) => {
      if (!db || !currentWorkspace) return;
      try {
        const doc = await db.lookups.findOne(`${currentWorkspace}:addr:${addressId}`).exec();
        if (doc) await doc.remove();
      } catch (error) {
        logger.error('Failed to remove address', error, { feature: 'Addresses', workspaceId: currentWorkspace, metadata: { addressId } });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllAddresses = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.lookups.find({ selector: { type: 'address', workspaceId: currentWorkspace } }).exec();
      await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
    } catch (error) {
      logger.error('Failed to clear addresses', error, { feature: 'Addresses', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { addresses, addAddress, updateAddress, removeAddress, clearAllAddresses, isLoaded };
}
