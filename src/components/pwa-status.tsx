'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';

export function PWAStatus() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;
    
    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none"
            suppressHydrationWarning
        >
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
