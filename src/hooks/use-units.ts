'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/lib/db/db-provider';

export function useUnits() {
  const db = useDatabase();
  const [units, setUnits] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.units.find().$.subscribe(data => {
      setUnits(data.map(d => d.toJSON().name));
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveUnits = useCallback(async (newUnits: string[]) => {
    if (!db) return;
    try {
      const allDocs = await db.units.find().exec();
      await Promise.all(allDocs.map(d => d.remove()));
      if (newUnits.length > 0) {
        await db.units.bulkInsert(newUnits.map(name => ({ name })));
      }
    } catch (error) {
      console.error('Failed to save units:', error);
    }
  }, [db]);

  const clearAllUnits = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.units.find().exec();
      await Promise.all(allDocs.map(d => d.remove()));
    } catch (error) {
      console.error('Failed to clear units:', error);
    }
  }, [db]);

  return { units, saveUnits, isLoaded, clearAllUnits };
}
