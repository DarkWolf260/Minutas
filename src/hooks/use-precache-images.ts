'use client';

import { useEffect } from 'react';
import { useReports } from './use-reports';

export function usePrecacheImages() {
  const { reports, isLoaded } = useReports();

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !('caches' in window)) return;

    let active = true;

    async function precache() {
      try {
        const cache = await caches.open('supabase-storage-cache');
        
        for (const report of reports) {
          if (!active) break;
          const photos = report.photos || [];
          for (const photo of photos) {
            if (!active) break;
            const url = photo.url;
            if (url && url.startsWith('http')) {
              try {
                const alreadyCached = await cache.match(url);
                if (!alreadyCached) {
                  // Perform fetch and store in cache API
                  await cache.add(url);
                }
              } catch (e) {
                // Ignore download errors for individual images to avoid crashing the loop
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to precache report images:', err);
      }
    }

    precache();

    return () => {
      active = false;
    };
  }, [reports, isLoaded]);
}
