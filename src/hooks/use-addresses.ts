'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
import { DEFAULT_ADDRESSES } from '@/constants/addresses';

export function useAddresses() {
    const db = useDatabase();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!db) return;

        const sub = db.addresses.find().$.subscribe(data => {
            if (data.length > 0) {
                setAddresses(data.map(d => d.toJSON()) as Address[]);
            } else {
                // Initial addresses if DB is empty
                db.addresses.bulkInsert(DEFAULT_ADDRESSES).catch(err => console.error('Failed to insert default addresses:', err));
            }
            setIsLoaded(true);
        });

        return () => sub.unsubscribe();
    }, [db]);

    const addAddress = useCallback(async (newAddress: Address) => {
        if (!db) return;
        try {
            await db.addresses.insert(newAddress);
        } catch (error) {
            console.error('Failed to add address:', error);
        }
    }, [db]);

    const updateAddress = useCallback(async (updatedAddress: Address) => {
        if (!db) return;
        try {
            const doc = await db.addresses.findOne(updatedAddress.id).exec();
            if (doc) await doc.patch(updatedAddress);
        } catch (error) {
            console.error('Failed to update address:', error);
        }
    }, [db]);

    const removeAddress = useCallback(async (addressId: string) => {
        if (!db) return;
        try {
            const doc = await db.addresses.findOne(addressId).exec();
            if (doc) await doc.remove();
        } catch (error) {
            console.error('Failed to remove address:', error);
        }
    }, [db]);

    const clearAllAddresses = useCallback(async () => {
        if (!db) return;
        try {
            const allDocs = await db.addresses.find().exec();
            await Promise.all(allDocs.map(d => d.remove()));
        } catch (error) {
            console.error('Failed to clear addresses:', error);
        }
    }, [db]);

    return { addresses, addAddress, updateAddress, removeAddress, clearAllAddresses, isLoaded };
}
