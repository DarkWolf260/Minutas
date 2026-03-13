'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="relative flex items-center justify-center">
        {/* Glowing Background Effect - stays fixed or pulses */}
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse scale-150" />
        
        {/* Bouncing Icon context */}
        <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="bg-background/90 backdrop-blur-sm p-6 rounded-full border border-primary/30 shadow-[0_0_50px_-12px_rgba(var(--primary),0.5)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 opacity-50" />
            <FileText className="h-10 w-10 text-primary" />
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-700">
          {message || 'Iniciando Sistema'}
        </h2>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>

      {/* Subtle bottom text */}
      {!isOverlay && (
        <p className="absolute bottom-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          Minutas Admin • v0.1.0
        </p>
      )}
    </div>
  );
}
