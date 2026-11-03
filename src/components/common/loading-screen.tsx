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
      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
        <img src="/icons/icon-192x192.png" alt="Logo" className="h-10 w-10 object-contain" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-muted-foreground text-center px-4">
          {message || 'Sincronizando Sistema'}
        </p>
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-shimmer w-full" />
        </div>
      </div>

      {!isOverlay && (
        <p className="absolute bottom-10 text-xs text-muted-foreground/50 font-normal">
          Minutas • v{APP_VERSION}
        </p>
      )}
    </div>
  );
}
