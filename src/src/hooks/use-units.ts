'use client';

import { useState, useEffect, useCallback } from 'react';

const UNITS_STORAGE_KEY = 'app-units';

const initialUnits: string[] = ['Alpha 1', 'Unidad 2'];

export function useUnits() {
  const [units, setUnits] = useState<string[]>(initialUnits);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedUnits = localStorage.getItem(UNITS_STORAGE_KEY);
      if (storedUnits) {
        const parsedUnits = JSON.parse(storedUnits);
        if (Array.isArray(parsedUnits) && parsedUnits.length > 0) {
            setUnits(parsedUnits);
        }
      }
    } catch (error) {
      console.error('Failed to load units from localStorage', error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveUnits = useCallback((newUnits: string[]) => {
    try {
      localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(newUnits));
      setUnits(newUnits);
    } catch (error) {
      console.error('Failed to save units to localStorage', error);
    }
  }, []);

  return { units, saveUnits, isLoaded };
}
