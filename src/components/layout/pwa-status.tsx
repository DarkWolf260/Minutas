'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, MonitorSmartphone } from 'lucide-react';
import { usePwa } from '@/components/providers/pwa-provider';
import { Button } from '@/components/ui/button';
import { SETUP_DONE_KEY, tryGet } from '@/hooks/use-setup';
import { toast } from 'sonner';

export function PWAStatus() {
    const {
        offlineReady,
        setOfflineReady,
        needRefresh,
        setNeedRefresh,
        updateServiceWorker,
        checkForUpdates,
    } = usePwa();

    const [isMounted, setIsMounted] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(true);
    const [isSetup, setIsSetup] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const setupDone = !!tryGet(SETUP_DONE_KEY);
        setIsSetup(!setupDone || window.location.pathname.includes('/setup'));

        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            console.log('PWA Install Draft Captured');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check for updates automatically in the background on startup (after 6 seconds)
        const updateCheckTimeout = setTimeout(() => {
            if (navigator.onLine) {
                checkForUpdates().catch((err) => console.error('PWA background update check failed:', err));
            }
        }, 6000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(updateCheckTimeout);
        };
    }, [checkForUpdates]);

    // Show a sticky toast notification when a new version is available
    useEffect(() => {
        if (needRefresh) {
            toast.info('Actualización disponible', {
                description: 'Hay una nueva versión de la aplicación. Haz clic en actualizar para aplicar los cambios.',
                action: {
                    label: 'Actualizar',
                    onClick: () => updateServiceWorker(true),
                },
                duration: Infinity, // keep open
                id: 'pwa-update-toast', // avoid duplicates
            });
        }
    }, [needRefresh, updateServiceWorker]);

    if (!isMounted || isSetup) return null;

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Install Choice: ${outcome}`);

        // We've used the prompt, and can't use it again
        setDeferredPrompt(null);
    };

    return (
        <div
            className="fixed bottom-20 sm:bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none"
            suppressHydrationWarning
        >
            {/* Install Prompt - Only show if available and no update is pending */}
            {deferredPrompt && !needRefresh && showInstallBtn && (
                <div className="pointer-events-auto flex items-center gap-1 group">
                    <Button
                        size="sm"
                        onClick={handleInstall}
                        className="h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition-all duration-300 backdrop-blur-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 flex items-center gap-2 pr-2"
                    >
                        <MonitorSmartphone className="h-3.5 w-3.5 animate-bounce" />
                        <span>Instalar PC Reportes</span>
                        <div className="h-4 w-px bg-primary/20 mx-1" />
                        <span
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInstallBtn(false);
                            }}
                            className="hover:bg-primary/20 p-0.5 rounded-full transition-colors cursor-pointer flex items-center justify-center w-4 h-4"
                        >
                            ×
                        </span>
                    </Button>
                </div>
            )}

            {needRefresh && (
                <div className="pointer-events-auto">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateServiceWorker(true)}
                        className="h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all duration-300 backdrop-blur-md bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 flex items-center gap-2"
                    >
                        <RefreshCw className="h-3 w-3" />
                        <span>Nueva Versión Disponible - Actualizar</span>
                    </Button>
                </div>
            )}

            {offlineReady && !needRefresh && (
                <div className="pointer-events-auto">
                    <div className="h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all duration-300 backdrop-blur-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                        <span>Lista para usar sin conexión</span>
                        <button onClick={close} className="ml-1 opacity-50 hover:opacity-100">×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
