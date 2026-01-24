
'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';

const UNITS_STORAGE_KEY = 'app-units';

const initialUnits: string[] = [];

export function useUnits() {
  const [units, setUnits, isLoaded] = useLocalStorage<string[]>(
    UNITS_STORAGE_KEY,
    initialUnits,
    {
      migrate: (parsed: any) => {
        // Ensure it's an array
        return Array.isArray(parsed) ? parsed : initialUnits;
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} units:`, error);
      }
    }
  );

  const saveUnits = useCallback((newUnits: string[]) => {
    setUnits(newUnits);
  }, [setUnits]);

  const clearAllUnits = useCallback(() => {
    setUnits(initialUnits);
  }, [setUnits]);

  return { units, saveUnits, isLoaded, clearAllUnits };
}
