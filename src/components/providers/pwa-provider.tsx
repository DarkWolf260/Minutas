'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PwaContextType {
  offlineReady: boolean;
  setOfflineReady: (val: boolean) => void;
  needRefresh: boolean;
  setNeedRefresh: (val: boolean) => void;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  checkForUpdates: () => Promise<boolean>;
  checkingForUpdates: boolean;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.log('PWA Service Worker registered:', r);
        setSwRegistration(r);
      }
    },
    onRegisterError(error) {
      console.error('PWA Service Worker registration error:', error);
    },
  });

  const checkForUpdates = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser/environment.');
      return false;
    }

    setCheckingForUpdates(true);

    // Let's first ensure we have the registration object.
    // If not set yet via onRegistered, try to get it from the navigator.
    let registration = swRegistration;
    if (!registration) {
      try {
        registration = await navigator.serviceWorker.ready;
        if (registration) {
          setSwRegistration(registration);
        }
      } catch (e) {
        console.error('Failed to get active Service Worker registration:', e);
      }
    }

    if (!registration) {
      // Simulate a small delay for a premium feel even if there is no registration available
      await new Promise((r) => setTimeout(r, 1500));
      setCheckingForUpdates(false);
      return false;
    }

    return new Promise<boolean>(async (resolve) => {
      let updateFound = false;

      // Event listener to catch if a new service worker script is found
      const onUpdateFound = () => {
        updateFound = true;
      };

      registration!.addEventListener('updatefound', onUpdateFound);

      try {
        // Force the browser to check the server (Vercel) for an updated service worker script
        await registration!.update();

        // Give the browser a moment (2 seconds) to parse, fetch, and trigger state changes
        await new Promise((r) => setTimeout(r, 2000));

        // In addition to the updatefound event, check if there's currently an installing or waiting worker
        if (registration!.installing || registration!.waiting) {
          updateFound = true;
        }

        resolve(updateFound);
      } catch (err) {
        console.error('Error during manual PWA update check:', err);
        resolve(false);
      } finally {
        registration!.removeEventListener('updatefound', onUpdateFound);
        setCheckingForUpdates(false);
      }
    });
  };

  const value: PwaContextType = {
    offlineReady,
    setOfflineReady,
    needRefresh,
    setNeedRefresh,
    updateServiceWorker,
    checkForUpdates,
    checkingForUpdates,
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}
