'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, ServerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnectionStatus } from '@/hooks/use-connection-status';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function OnlineStatus() {
    const { isOnline, isServerUp } = useConnectionStatus();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const getStatusConfig = () => {
        if (!isOnline) {
            return {
                icon: <WifiOff className="h-3 w-3" />,
                text: "Offline",
                colorClass: "bg-destructive/20 text-destructive border border-destructive/30",
                dotClass: "bg-destructive",
                tooltip: "Trabajando en modo local (sin conexión)"
            };
        }
        if (!isServerUp) {
            return {
                icon: <ServerOff className="h-3 w-3" />,
                text: "Sin Servidor",
                colorClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30",
                dotClass: "bg-amber-500",
                tooltip: "Conectado a internet, pero el servidor no responde"
            };
        }
        return {
            icon: <Wifi className="h-3 w-3" />,
            text: "En Línea",
            colorClass: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
            dotClass: "bg-emerald-500",
            tooltip: "Conectado al servidor de Minutas"
        };
    };

    const config = getStatusConfig();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={cn(
                        "flex items-center justify-center rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all duration-500 backdrop-blur-md",
                        "w-9 h-5 sm:w-auto sm:h-auto sm:px-3 sm:py-1 gap-1 sm:gap-2",
                        config.colorClass
                    )}
                >
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        config.dotClass
                    )} />
                    {config.icon}
                    <span className="hidden sm:inline">{config.text}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="text-[10px]">
                {config.tooltip}
            </TooltipContent>
        </Tooltip>
    );
}
