'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (import.meta.env.DEV) {
      // In development, unregister any existing service worker to avoid conflicts with Vite HMR
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[PWA] Unregistered service worker for development compatibility');
        }
      });
      return;
    }

    // In production, register the service worker
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
  }, []);

  return null;
}
