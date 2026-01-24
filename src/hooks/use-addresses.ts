
'use client';

import { useCallback } from 'react';
import type { Address } from '@/types';
import { useLocalStorage } from './use-local-storage';
import { DEFAULT_ADDRESSES } from '@/constants/addresses';

const ADDRESSES_STORAGE_KEY = 'app-addresses';

export function useAddresses() {
    const [addresses, setAddresses, isLoaded] = useLocalStorage<Address[]>(
        ADDRESSES_STORAGE_KEY,
        DEFAULT_ADDRESSES,
        {
            migrate: (parsed: any[]) => {
                // Only set parsed data if it's a non-empty array
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
                return DEFAULT_ADDRESSES;
            },
            onError: (error, operation) => {
                console.error(`Failed to ${operation} addresses:`, error);
            }
        }
    );

    const addAddress = useCallback((newAddress: Address) => {
        setAddresses(prev =>
            [...prev, newAddress].sort((a, b) => a.name.localeCompare(b.name))
        );
    }, [setAddresses]);

    const updateAddress = useCallback((updatedAddress: Address) => {
        setAddresses(prev =>
            prev.map(a => a.id === updatedAddress.id ? updatedAddress : a)
                .sort((a, b) => a.name.localeCompare(b.name))
        );
    }, [setAddresses]);

    const removeAddress = useCallback((addressId: string) => {
        setAddresses(prev => prev.filter(a => a.id !== addressId));
    }, [setAddresses]);

    const clearAllAddresses = useCallback(() => {
        setAddresses([]);
    }, [setAddresses]);

    return { addresses, addAddress, updateAddress, removeAddress, clearAllAddresses, isLoaded };
}
