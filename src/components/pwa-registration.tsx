'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          logger.info('Service Worker registered', registration);
        })
        .catch((registrationError) => {
          logger.error('Service Worker registration failed', registrationError);
        });
    }
  }, []);

  return null;
}
