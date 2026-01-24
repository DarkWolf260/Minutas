/**
 * Generic hook for localStorage persistence with automatic serialization,
 * error handling, and migration support.
 * 
 * @template T - The type of data to store
 * @param key - localStorage key
 * @param defaultValue - Default value if no stored data exists
 * @param options - Optional configuration
 * @returns [data, setData, isLoaded] tuple
 * 
 * @example
 * const [settings, setSettings, isLoaded] = useLocalStorage('app-settings', {
 *   theme: 'light'
 * });
 * 
 * // Supports both direct values and updater functions
 * setSettings({ theme: 'dark' });
 * setSettings(prev => ({ ...prev, theme: 'dark' }));
 */

'use client';

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

export interface UseLocalStorageOptions<T> {
    /**
     * Migration function to transform old stored data to new format
     */
    migrate?: (storedData: any) => T;

    /**
     * Custom serializer (default: JSON.stringify)
     */
    serialize?: (data: T) => string;

    /**
     * Custom deserializer (default: JSON.parse)
     */
    deserialize?: (data: string) => any;

    /**
     * Error callback for load/save operations
     */
    onError?: (error: unknown, operation: 'load' | 'save') => void;
}

export function useLocalStorage<T>(
    key: string,
    defaultValue: T,
    options: UseLocalStorageOptions<T> = {}
): [T, Dispatch<SetStateAction<T>>, boolean] {
    const {
        migrate,
        serialize = JSON.stringify,
        deserialize = JSON.parse,
        onError,
    } = options;

    const [data, setData] = useState<T>(defaultValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                let parsed = deserialize(stored);

                // Apply migration if provided
                if (migrate) {
                    parsed = migrate(parsed);
                }

                setData(parsed);
            } else {
                setData(defaultValue);
            }
        } catch (error) {
            console.error(`[useLocalStorage] Failed to load "${key}":`, error);
            onError?.(error, 'load');
            setData(defaultValue);
        } finally {
            setIsLoaded(true);
        }
    }, [key]); // Only re-run if key changes

    // Save to localStorage with support for updater functions
    const saveData = useCallback<Dispatch<SetStateAction<T>>>(
        (value) => {
            try {
                // Support both direct values and updater functions
                const newValue = value instanceof Function ? value(data) : value;
                setData(newValue);
                localStorage.setItem(key, serialize(newValue));
            } catch (error) {
                console.error(`[useLocalStorage] Failed to save "${key}":`, error);
                onError?.(error, 'save');
            }
        },
        [key, serialize, data, onError]
    );

    return [data, saveData, isLoaded];
}

