'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useConnectionStatus } from '@/hooks/use-connection-status';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function PWAStatus() {
    const { isOnline, isServerUp, updateAvailable, handleUpdate } = useConnectionStatus();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const getStatusInfo = () => {
        if (!isOnline) return {
            color: "bg-destructive/20 text-destructive border border-destructive/30",
            dotColor: "bg-destructive",
            text: "Offline",
            tooltip: "Trabajando en modo local (sin conexión a internet)"
        };

        if (!isServerUp) return {
            color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30",
            dotColor: "bg-amber-500",
            text: "Servidor Desconectado",
            tooltip: "Sin conexión con el servidor de Minutas (verifique el servidor)"
        };

        return {
            color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
            dotColor: "bg-emerald-500",
            text: "En Línea",
            tooltip: "Conectado al servidor de Minutas"
        };
    };

    const status = getStatusInfo();

    return (
        <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none"
            suppressHydrationWarning
        >
            {updateAvailable && (
                <div className="pointer-events-auto">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleUpdate}
                        className="h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all duration-300 backdrop-blur-md bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 flex items-center gap-2"
                    >
                        <RefreshCw className="h-3 w-3" />
                        <span>Actualizar Aplicación</span>
                    </Button>
                </div>
            )}

            {/* Hidden on mobile, shown on SM breakpoint and up */}
            <div className="pointer-events-auto hidden sm:flex">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all duration-500 backdrop-blur-md",
                                status.color
                            )}
                        >
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                status.dotColor
                            )} />
                            {isOnline ? (
                                isServerUp ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />
                            ) : (
                                <WifiOff className="h-3 w-3" />
                            )}
                            <span>{status.text}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="end" className="text-[10px]">
                        {status.tooltip}
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
