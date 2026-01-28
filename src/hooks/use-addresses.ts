'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
import { DEFAULT_ADDRESSES } from '@/constants/addresses';
import { logger } from '@/lib/logger';

export function useAddresses() {
  const db = useDatabase();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.addresses.find().$.subscribe((data) => {
      if (data.length > 0) {
        setAddresses(data.map((d) => d.toJSON()) as Address[]);
      } else {
        // Initial addresses if DB is empty
        db.addresses
          .bulkInsert(DEFAULT_ADDRESSES)
          .catch((err) => logger.error('Failed to insert default addresses', err, { feature: 'Addresses' }));
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const addAddress = useCallback(
    async (newAddress: Address) => {
      if (!db) return;
      try {
        await db.addresses.insert(newAddress);
      } catch (error) {
        logger.error('Failed to add address', error, { feature: 'Addresses', metadata: { addressId: newAddress.id } });
      }
    },
    [db]
  );

  const updateAddress = useCallback(
    async (updatedAddress: Address) => {
      if (!db) return;
      try {
        const doc = await db.addresses.findOne(updatedAddress.id).exec();
        if (doc) await doc.patch(updatedAddress);
      } catch (error) {
        logger.error('Failed to update address', error, { feature: 'Addresses', metadata: { addressId: updatedAddress.id } });
      }
    },
    [db]
  );

  const removeAddress = useCallback(
    async (addressId: string) => {
      if (!db) return;
      try {
        const doc = await db.addresses.findOne(addressId).exec();
        if (doc) await doc.remove();
      } catch (error) {
        logger.error('Failed to remove address', error, { feature: 'Addresses', metadata: { addressId } });
      }
    },
    [db]
  );

  const clearAllAddresses = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.addresses.find().exec();
      await Promise.all(allDocs.map((d) => d.remove()));
    } catch (error) {
      logger.error('Failed to clear addresses', error, { feature: 'Addresses' });
    }
  }, [db]);

  return { addresses, addAddress, updateAddress, removeAddress, clearAllAddresses, isLoaded };
}
