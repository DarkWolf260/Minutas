'use client';

import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/pages/settings/about/data';


interface LoadingScreenProps {
  message?: string;
  isOverlay?: boolean;
}

export function LoadingScreen({ message, isOverlay = false }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center z-50 transition-all duration-500",
        isOverlay 
          ? "fixed inset-0 bg-background/80 backdrop-blur-md" 
          : "min-h-screen bg-background"
      )}
    >
      <div className="bg-primary/10 text-primary-foreground w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 animate-bounce overflow-hidden border-2 border-primary/20 p-4 mb-6">
        <img src="/icons/icon-192x192.png" alt="Logo" className="w-full h-full object-contain" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-black tracking-[0.1em] sm:tracking-[0.3em] text-muted-foreground uppercase opacity-90 animate-pulse text-center px-4">
          {message || 'Sincronizando Sistema'}
        </p>
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-shimmer w-full" />
        </div>
      </div>

      {!isOverlay && (
        <p className="absolute bottom-10 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 font-bold">
          Minutas • v{APP_VERSION}
        </p>
      )}
    </div>
  );
}
