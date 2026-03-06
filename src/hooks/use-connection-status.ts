'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface ConnectionStatus {
    isOnline: boolean;
    isServerUp: boolean;
    updateAvailable: boolean;
    checkServerStatus: () => Promise<void>;
    handleUpdate: () => Promise<void>;
}

export function useConnectionStatus(): ConnectionStatus {
    const [isOnline, setIsOnline] = useState(true);
    const [isServerUp, setIsServerUp] = useState(true);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const checkServerStatus = useCallback(async () => {
        if (!navigator.onLine) {
            setIsServerUp(false);
            return;
        }

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);
            const response = await fetch('/api/health', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(id);
            setIsServerUp(response.ok);
        } catch (error) {
            logger.warn("Server health check failed:", error);
            setIsServerUp(false);
        }
    }, []);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            checkServerStatus();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setIsServerUp(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial server check
        if (navigator.onLine) {
            checkServerStatus();
        } else {
            setIsServerUp(false);
        }

        // Periodic server check (every 30 seconds to be less aggressive than before but still useful)
        const interval = setInterval(() => {
            if (navigator.onLine) {
                checkServerStatus();
            }
        }, 30000);

        // Check for SW updates
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                const checkWaiting = () => {
                    if (registration.waiting) {
                        setUpdateAvailable(true);
                    }
                };

                checkWaiting();

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setUpdateAvailable(true);
                            }
                        });
                    }
                });
            });

            const handleControllerChange = () => {
                window.location.reload();
            };
            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
                clearInterval(interval);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkServerStatus]);

    const handleUpdate = useCallback(async () => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        } else {
            window.location.reload();
        }
    }, []);

    return {
        isOnline,
        isServerUp,
        updateAvailable,
        checkServerStatus,
        handleUpdate
    };
}
