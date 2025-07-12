
'use client';

import { useState, useEffect, useCallback } from 'react';

const UNITS_STORAGE_KEY = 'app-units';

const initialUnits: string[] = [];

export function useUnits() {
  const [units, setUnits] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedUnits = localStorage.getItem(UNITS_STORAGE_KEY);
      if (storedUnits) {
        const parsedUnits = JSON.parse(storedUnits);
        if (Array.isArray(parsedUnits)) {
            setUnits(parsedUnits);
        } else {
            setUnits(initialUnits);
        }
      } else {
          setUnits(initialUnits);
      }
    } catch (error) {
      console.error('Failed to load units from localStorage', error);
      setUnits(initialUnits);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveUnits = useCallback((newUnits: string[]) => {
    setUnits(newUnits);
    try {
      localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(newUnits));
    } catch (error) {
      console.error('Failed to save units to localStorage', error);
    }
  }, []);

  const clearAllUnits = useCallback(() => {
    saveUnits(initialUnits);
  }, [saveUnits]);

  return { units, saveUnits, isLoaded, clearAllUnits };
}
